#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  ATOMIC_AXES,
  OPUS_CHALLENGER_TARGETS,
  buildDeterministicExecutionContract,
  getAxisProtocol,
  inferProviderForModel,
  selectExecutionPolicy,
  shouldPreserveModelForProvider
} = require('../model_adaptation_contract.js');

const ROOT = path.resolve(__dirname, '..');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const OUT_DIR = path.join(ROOT, 'reports', 'model-adaptation', TIMESTAMP);
const ARGS = new Set(process.argv.slice(2));
const OFFLINE = ARGS.has('--offline') || !ARGS.has('--live');
const WANT_CLAUDE_BASELINE = ARGS.has('--claude-baseline');
const WANT_SELECTED_LIVE = ARGS.has('--selected-live');
const WRITE_LEDGER = ARGS.has('--ledger') || process.env.AETHER_MODEL_ADAPTATION_LEDGER === '1';
const USE_CONSOLE_API = ARGS.has('--console-api') || process.env.AETHER_MODEL_ADAPTATION_CONSOLE_API === '1' || Boolean(process.env.AETHER_MODEL_ADAPTATION_API_URL || process.env.AETHER_CLI_API_URL);
const USE_AETHER_CONSOLE = ARGS.has('--aether-console') || process.env.AETHER_MODEL_ADAPTATION_AETHER_CONSOLE === '1';
const CONSOLE_API_URL = process.env.AETHER_MODEL_ADAPTATION_API_URL || process.env.AETHER_CLI_API_URL || process.env.AETHER_MCP_URL || process.env.MCP_URL || 'http://localhost:3847/health';
const SELECTED_MODEL = process.env.AETHER_MODEL || process.env.AETHER_PLANNER_MODEL || 'openai/gpt-oss-120b:free';
const CLAUDE_BASELINE_MODEL = process.env.ANTHROPIC_BASELINE_MODEL || 'claude-opus-4-6';
const AXIS_FILTER = (() => {
  const axisArg = [...ARGS].find(arg => arg.startsWith('--axis='));
  const axesArg = [...ARGS].find(arg => arg.startsWith('--axes='));
  const raw = process.env.AETHER_MODEL_ADAPTATION_AXES ||
    (axisArg ? axisArg.split('=', 2)[1] : '') ||
    (axesArg ? axesArg.split('=', 2)[1] : '');
  return new Set(String(raw || '').split(',').map(item => item.trim()).filter(Boolean));
})();

const AXIS_PROOF_REQUIREMENTS = Object.freeze({
  deep_reasoning: ['hypotheses', 'disconfirmingEvidence', 'counterexamples', 'secondOrderEffects', 'decision', 'residualRisk'],
  tool_calling: ['toolIntent', 'selectedTool', 'schemaValidation', 'arguments', 'evidence', 'residualRisk'],
  natural_tool_calling: ['toolIntent', 'selectedTool', 'schemaValidation', 'arguments', 'reconciliation', 'residualRisk'],
  code_review: ['findings', 'severities', 'regressions', 'tests', 'evidence', 'residualRisk'],
  long_context: ['contextMap', 'sourceAnchors', 'assumptionsRefreshed', 'checkpoints', 'residualRisk'],
  agentic_persistence: ['checkpoints', 'retryBudget', 'blockerAudit', 'changedTactics', 'nextActions', 'residualRisk'],
  security: ['risks', 'secretHandling', 'authProof', 'blastRadius', 'minimumFix', 'residualRisk'],
  instruction_following: ['scope', 'constraints', 'evidence', 'uncertainty', 'residualRisk']
});

function proofInstruction(axis) {
  const required = AXIS_PROOF_REQUIREMENTS[axis] || ['decision', 'evidence', 'residualRisk'];
  return [
    'Return ONLY valid compact JSON.',
    'Do not include markdown, prose outside JSON, or hidden reasoning.',
    `Required top-level keys: axis, ${required.join(', ')}.`,
    `Set axis exactly to "${axis}".`,
    'Arrays must contain concrete items, not placeholders.'
  ].join(' ');
}

function scenarioMessage(axis, task) {
  return `${task}\n\n${proofInstruction(axis)}`;
}

const allScenarios = [
  {
    axis: 'deep_reasoning',
    model: SELECTED_MODEL,
    messages: [{ role: 'user', content: scenarioMessage('deep_reasoning', 'Reason deeply about a conflicting architecture decision with hypotheses, counterexamples, and second-order effects.') }],
    tools: []
  },
  {
    axis: 'tool_calling',
    model: SELECTED_MODEL,
    messages: [{ role: 'user', content: scenarioMessage('tool_calling', 'Use MCP tools to inspect a patch, then provide evidence and residual risk.') }],
    tools: [{ type: 'function', function: { name: 'FileRead', parameters: { type: 'object' } } }]
  },
  {
    axis: 'natural_tool_calling',
    model: SELECTED_MODEL,
    messages: [{ role: 'user', content: scenarioMessage('natural_tool_calling', 'Convert this natural request into the minimal MCP tool call, validate JSON schema arguments, execute, and reconcile the output.') }],
    tools: [{ type: 'function', function: { name: 'Grep', parameters: { type: 'object' } } }]
  },
  {
    axis: 'code_review',
    model: SELECTED_MODEL,
    messages: [{ role: 'user', content: scenarioMessage('code_review', 'Review this relay change for regressions, edge cases, and missing tests.') }],
    tools: []
  },
  {
    axis: 'long_context',
    model: SELECTED_MODEL,
    messages: [{ role: 'user', content: scenarioMessage('long_context', 'Handle a large repo with cli.js.map, source map anchors, context checkpoints, and refreshed assumptions.') }],
    tools: []
  },
  {
    axis: 'agentic_persistence',
    model: SELECTED_MODEL,
    messages: [{ role: 'user', content: scenarioMessage('agentic_persistence', 'Persist through a long-running MCP task with checkpoint, retry budget, blocker audit, and changed tactics after failures.') }],
    tools: []
  },
  {
    axis: 'security',
    model: SELECTED_MODEL,
    messages: [{ role: 'user', content: scenarioMessage('security', 'Audit provider routing for secret leaks, auth risks, and false certification claims.') }],
    tools: []
  },
  {
    axis: 'instruction_following',
    model: SELECTED_MODEL,
    messages: [{ role: 'user', content: scenarioMessage('instruction_following', 'Follow the exact output contract and do not claim success without artifacts.') }],
    tools: []
  }
];

const scenarios = AXIS_FILTER.size > 0
  ? allScenarios.filter(scenario => AXIS_FILTER.has(scenario.axis))
  : allScenarios;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function writeJson(name, data) {
  const filePath = path.join(OUT_DIR, name);
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, content, 'utf8');
  return { path: filePath, sha256: sha256(content), bytes: Buffer.byteLength(content) };
}

function writeText(name, content) {
  const filePath = path.join(OUT_DIR, name);
  fs.writeFileSync(filePath, content, 'utf8');
  return { path: filePath, sha256: sha256(content), bytes: Buffer.byteLength(content) };
}

function envPresent(names) {
  return names.some(name => Boolean(process.env[name]));
}

function runCli(command, args, input, timeoutMs = 90000) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    input,
    encoding: 'utf8',
    timeout: timeoutMs,
    windowsHide: true,
    shell: false
  });
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? String(result.error.message || result.error) : null
  };
}

function redactUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (/key|token|secret|auth|hmac/i.test(key)) url.searchParams.set(key, '[REDACTED]');
    }
    return url.toString();
  } catch {
    return String(rawUrl || '').replace(/(key|token|secret|auth|hmac)=([^&\s]+)/ig, '$1=[REDACTED]');
  }
}

function redactSecrets(value) {
  return String(value || '')
    .replace(/("x-api-key"\s*:\s*")([^"]+)(")/ig, '$1[REDACTED]$3')
    .replace(/("api[_-]?key"\s*:\s*")([^"]+)(")/ig, '$1[REDACTED]$3')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/ig, '$1[REDACTED]')
    .replace(/\bsk-(?:ant|or|proj)?-[A-Za-z0-9._-]+/g, 'sk-[REDACTED]');
}

function apiProbeUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return 'http://localhost:3847/health';
  if (/\/(health|metrics|mcp|mcp\/stream|chat\/completions)(\?|$)/i.test(value)) return value;
  return value.replace(/\/+$/, '') + '/health';
}

async function probeConsoleApiTransport() {
  if (!USE_CONSOLE_API) {
    return {
      requested: false,
      status: 'not_requested',
      url: redactUrl(CONSOLE_API_URL)
    };
  }
  const targetUrl = apiProbeUrl(CONSOLE_API_URL);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AETHER_MODEL_ADAPTATION_API_TIMEOUT_MS || 5000));
  const startedAt = new Date().toISOString();
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json,text/plain,*/*' }
    });
    const raw = await response.text();
    const bodyPreview = redactSecrets(raw).slice(0, 1000);
    const status = response.ok
      ? 'ok'
      : ([401, 403].includes(response.status) ? 'auth_required' : 'http_error');
    return {
      requested: true,
      status,
      url: redactUrl(targetUrl),
      startedAt,
      endedAt: new Date().toISOString(),
      httpStatus: response.status,
      bodyHash: sha256(bodyPreview),
      bodyBytes: Buffer.byteLength(raw),
      bodyPreview
    };
  } catch (error) {
    return {
      requested: true,
      status: 'error',
      url: redactUrl(targetUrl),
      startedAt,
      endedAt: new Date().toISOString(),
      error: String(error && error.message ? error.message : error).slice(0, 1000)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function selectedProviderReadiness(model) {
  const provider = inferProviderForModel(model, process.env.AETHER_PROVIDER || 'siliconflow');
  const providerEnv = {
    openrouter: ['OPENROUTER_API_KEY', 'OPENROUTER_KEYS', 'AETHER_OR_KEYS', 'AETHER_RELAY_KEY_ALPHA'],
    openai: ['OPENAI_API_KEY', 'OPENAI_KEYS'],
    google: ['GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'],
    siliconflow: ['AETHER_SF_KEYS', 'SILICONFLOW_KEYS', 'SILICONFLOW_API_KEY_AYMAN', 'AETHER_RELAY_KEY_ALPHA'],
    github: ['GITHUB_MODELS_TOKEN']
  };
  const acceptedEnv = providerEnv[provider] || [];
  return {
    model,
    inferredProvider: provider,
    acceptedEnv,
    keyPresent: envPresent(acceptedEnv)
  };
}

function battleReadiness() {
  const selected = selectedProviderReadiness(SELECTED_MODEL);
  const claude = {
    model: CLAUDE_BASELINE_MODEL,
    acceptedEnv: ['ANTHROPIC_API_KEY'],
    keyPresent: envPresent(['ANTHROPIC_API_KEY'])
  };
  return {
    generatedAt: new Date().toISOString(),
    selected,
    claude,
    consoleApi: {
      requested: USE_CONSOLE_API,
      url: redactUrl(apiProbeUrl(CONSOLE_API_URL)),
      countsAsModelProof: false
    },
    aetherConsole: {
      requested: USE_AETHER_CONSOLE,
      command: './aether.ps1 console --model=<selected> -p <prompt>',
      countsAsModelProof: true
    },
    readyForLiveBattle: (selected.keyPresent || USE_AETHER_CONSOLE) && claude.keyPresent,
    missing: [
      ...(selected.keyPresent || USE_AETHER_CONSOLE ? [] : [{ side: 'selected', provider: selected.inferredProvider, env: selected.acceptedEnv, method: 'aether_console_or_provider_key_required' }]),
      ...(claude.keyPresent ? [] : [{ side: 'claude', provider: 'anthropic', env: claude.acceptedEnv, method: 'fresh_baseline_required' }])
    ]
  };
}

function scoreScenario(scenario) {
  const provider = inferProviderForModel(scenario.model, process.env.AETHER_PROVIDER || 'siliconflow');
  const policy = selectExecutionPolicy({
    model: scenario.model,
    messages: scenario.messages,
    tools: scenario.tools,
    fallbackProvider: process.env.AETHER_PROVIDER || 'siliconflow'
  });
  const contract = buildDeterministicExecutionContract({
    model: scenario.model,
    provider,
    axis: scenario.axis,
    usesTools: scenario.tools.length > 0
  });
  const axisProtocol = getAxisProtocol(scenario.axis).join('\n');
  const challengerTarget = OPUS_CHALLENGER_TARGETS[scenario.axis] || 95;

  const checks = [
    { name: 'preserves_selected_model', pass: shouldPreserveModelForProvider(scenario.model, 'openrouter') || scenario.model === 'local/unknown-model' },
    { name: 'contract_mentions_deterministic_execution', pass: contract.includes('Deterministic Execution Contract') },
    { name: 'contract_mentions_opus_challenger', pass: contract.includes('Opus-challenger') || contract.includes('Opus-class') },
    { name: 'requires_intent_to_risk_loop', pass: contract.includes('intent extraction') && contract.includes('residual risk') },
    { name: 'requires_self_review', pass: contract.includes('Review passes required') },
    { name: 'requires_evidence_guard', pass: contract.includes('fresh artifacts') && contract.includes('validation output') },
    { name: 'guards_tool_json', pass: scenario.tools.length === 0 || contract.includes('valid JSON') },
    { name: 'policy_matches_axis', pass: policy.axis === scenario.axis || ATOMIC_AXES.includes(policy.axis) },
    { name: 'temperature_is_review_safe', pass: !['deep_reasoning', 'code_review', 'security', 'long_context'].includes(scenario.axis) || policy.temperature <= 0.15 },
    { name: 'opus_challenger_target_declared', pass: !OPUS_CHALLENGER_TARGETS[scenario.axis] || contract.includes(`${challengerTarget}/100`) },
    { name: 'review_passes_escalated_for_opus_axes', pass: !OPUS_CHALLENGER_TARGETS[scenario.axis] || policy.maxReviewPasses >= 4 },
    { name: 'axis_protocol_injected', pass: axisProtocol.split('\n').every(line => contract.includes(line)) },
    { name: 'scenario_demands_structured_proof_json', pass: scenario.messages.every(message => String(message.content).includes('Return ONLY valid compact JSON')) },
    { name: 'no_secret_material', pass: !/sk-[A-Za-z0-9]/.test(contract) && !contract.includes(process.env.OPENAI_API_KEY || '__missing__') },
    { name: 'does_not_claim_unproven_victory', pass: contract.includes('Never claim superiority') }
  ];

  const passed = checks.filter(check => check.pass).length;
  const score = Math.round((passed / checks.length) * 100);
  return {
    axis: scenario.axis,
    model: scenario.model,
    provider,
    offline: OFFLINE,
    policy,
    challengerTarget,
    score,
    passed,
    total: checks.length,
    checks,
    contract
  };
}

function anthropicToolsFromScenario(scenario) {
  return (scenario.tools || [])
    .map(tool => {
      const fn = tool.function || tool;
      if (!fn.name) return null;
      return {
        name: fn.name,
        description: fn.description || `TheSource benchmark tool for ${scenario.axis}.`,
        input_schema: fn.parameters || { type: 'object', properties: {} }
      };
    })
    .filter(Boolean);
}

function responseTextFromAnthropic(data) {
  return (data.content || [])
    .map(block => {
      if (block.type === 'text') return block.text || '';
      if (block.type === 'tool_use') return `TOOL_USE ${block.name} ${JSON.stringify(block.input || {})}`;
      if (block.type === 'thinking') return `THINKING ${block.thinking || ''}`;
      return '';
    })
    .join('\n')
    .trim();
}

function responseTextFromRelay(data) {
  return (data.content || [])
    .map(block => {
      if (block.type === 'text') return block.text || '';
      if (block.type === 'tool_use') return `TOOL_USE ${block.name} ${JSON.stringify(block.input || {})}`;
      return '';
    })
    .join('\n')
    .trim();
}

function extractJsonLine(raw, expectedAxis) {
  const lines = String(raw || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!line.startsWith('{') || !line.endsWith('}')) continue;
    try {
      const parsed = JSON.parse(line);
      if (!expectedAxis || String(parsed.axis || '').toLowerCase() === expectedAxis.toLowerCase()) {
        return { text: line, parsed };
      }
      if (typeof parsed.result === 'string') {
        const nested = extractJsonObject(parsed.result);
        if (nested && (!expectedAxis || String(nested.axis || '').toLowerCase() === expectedAxis.toLowerCase())) {
          return { text: JSON.stringify(nested), parsed: nested };
        }
      }
    } catch {}
  }
  return { text: '', parsed: null };
}

function aetherConsolePromptForScenario(scenario) {
  const required = AXIS_PROOF_REQUIREMENTS[scenario.axis] || ['decision', 'evidence', 'residualRisk'];
  return [
    `Benchmark axis: ${scenario.axis}.`,
    'Return ONLY one compact JSON object. Do not ask a question. Do not use markdown.',
    `Set "axis" exactly to "${scenario.axis}".`,
    `Required keys: axis, ${required.join(', ')}.`,
    'Every required key except axis must contain a concrete non-empty array or string.',
    'Use this concrete benchmark context: TheSource adapts the selected console model into deterministic execution using constraints, evidence, artifact hashes, and residual-risk reporting.',
    'The response is used as a live console proof, so include evidence and uncertainty explicitly.'
  ].join(' ');
}

function liveRubricForAxis(axis) {
  const rubrics = {
    deep_reasoning: ['hypothesis', 'counterexample', 'decision', 'risk'],
    code_review: ['finding', 'severity', 'regression', 'test'],
    long_context: ['source', 'anchor', 'assumption', 'checkpoint'],
    agentic_persistence: ['checkpoint', 'retry', 'blocker', 'next'],
    natural_tool_calling: ['tool', 'schema', 'argument', 'result'],
    tool_calling: ['tool', 'json', 'evidence', 'result'],
    security: ['secret', 'risk', 'auth', 'redact'],
    instruction_following: ['scope', 'evidence', 'risk', 'uncertainty']
  };
  return rubrics[axis] || ['evidence', 'risk', 'action', 'result'];
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {}
  }
  return null;
}

function hasMeaningfulValue(value) {
  if (Array.isArray(value)) return value.length > 0 && value.some(hasMeaningfulValue);
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return typeof value === 'string' ? value.trim().length > 2 : value !== undefined && value !== null;
}

function scoreStructuredProof(axis, text) {
  const required = AXIS_PROOF_REQUIREMENTS[axis] || ['decision', 'evidence', 'residualRisk'];
  const proof = extractJsonObject(text);
  if (!proof || typeof proof !== 'object') {
    return {
      score: 0,
      proofValid: false,
      required,
      present: [],
      missing: required,
      axisMatches: false
    };
  }

  const present = required.filter(key => hasMeaningfulValue(proof[key]));
  const axisMatches = String(proof.axis || '').toLowerCase() === axis.toLowerCase();
  const validCount = present.length + (axisMatches ? 1 : 0);
  const total = required.length + 1;
  return {
    score: Math.round((validCount / total) * 100),
    proofValid: true,
    required,
    present,
    missing: required.filter(key => !present.includes(key)),
    axisMatches,
    proofHash: sha256(JSON.stringify(proof))
  };
}

function scoreLiveResponse(axis, text) {
  const structured = scoreStructuredProof(axis, text);
  const lower = String(text || '').toLowerCase();
  const rubric = liveRubricForAxis(axis);
  const hits = rubric.filter(term => lower.includes(term));
  const keywordScore = Math.round((hits.length / rubric.length) * 100);
  const score = structured.proofValid
    ? Math.round((structured.score * 0.85) + (keywordScore * 0.15))
    : Math.min(60, keywordScore);
  return {
    score,
    structured,
    keywordScore,
    rubric,
    hits,
    missing: rubric.filter(term => !hits.includes(term))
  };
}

function buildComparisonMatrix({ transcripts, liveComparisons, threshold, liveBattleRequested }) {
  const transcriptByAxis = new Map(transcripts.map(item => [item.axis, item]));
  return liveComparisons.map(item => {
    const transcript = transcriptByAxis.get(item.axis);
    const axisTarget = OPUS_CHALLENGER_TARGETS[item.axis] || 95;
    const selectedScore = item.selected.status === 'ok' ? item.selected.score.score : null;
    const claudeScore = item.claude.status === 'ok' ? item.claude.score.score : null;
    const offlineStatus = transcript && transcript.score >= threshold ? 'pass' : 'fail';
    let winner = 'unproven';
    let claudeOutcome = 'unproven_no_fresh_baseline';
    let proofState = liveBattleRequested ? 'missing_live_evidence' : 'offline_threshold_only';

    if (selectedScore !== null && claudeScore !== null) {
      if (selectedScore > claudeScore) winner = 'selected';
      else if (claudeScore > selectedScore) winner = 'claude';
      else winner = 'tie';

      if (item.directVictory) {
        claudeOutcome = 'defeated_on_this_axis';
        proofState = 'direct_victory_proven';
      } else if (claudeScore > selectedScore) {
        claudeOutcome = 'claude_live_advantage';
        proofState = 'selected_lost_live_axis';
      } else {
        claudeOutcome = 'selected_not_above_target';
        proofState = 'selected_met_or_tied_baseline_but_missed_axis_target';
      }
    }

    const missingEvidence = [];
    if (item.selected.status !== 'ok') missingEvidence.push(`selected:${item.selected.status}`);
    if (item.claude.status !== 'ok') missingEvidence.push(`claude:${item.claude.status}`);

    return {
      axis: item.axis,
      target: axisTarget,
      offlineContractScore: transcript ? transcript.score : null,
      offlineStatus,
      selectedStatus: item.selected.status,
      selectedScore,
      claudeStatus: item.claude.status,
      claudeScore,
      winner,
      claudeOutcome,
      directVictory: item.directVictory,
      proofState,
      missingEvidence
    };
  });
}

function markdownTableRow(cells) {
  return `| ${cells.map(value => String(value).replace(/\|/g, '/')).join(' |')} |`;
}

function buildComparisonReport({ summary, comparisonMatrix, artifacts }) {
  const verdict = summary.directVictoryProven
    ? 'Direct victory is proven on every live axis.'
    : summary.liveBattleRequested
      ? 'Direct victory is not proven because at least one live artifact or axis is missing or failed.'
      : 'Only offline deterministic threshold validation is proven; direct Claude comparison was not requested.';

  const rows = comparisonMatrix.map(item => markdownTableRow([
    item.axis,
    item.target,
    item.offlineContractScore,
    item.selectedStatus,
    item.selectedScore ?? 'n/a',
    item.claudeStatus,
    item.claudeScore ?? 'n/a',
    item.winner,
    item.proofState
  ]));

  return [
    '# TheSource Model Adaptation Comparison',
    '',
    `Generated: ${summary.generatedAt}`,
    `Selected model: ${summary.selectedModel}`,
    `Baseline model: ${summary.baselineModel}`,
    `Mode: ${summary.mode}`,
    `Overall status: ${summary.passed ? 'PASS' : 'FAIL'}`,
    `Claim: ${summary.claim}`,
    `Verdict: ${verdict}`,
    '',
    '| Axis | Target | Offline score | Selected live | Selected score | Claude live | Claude score | Winner | Proof state |',
    '| :--- | ---: | ---: | :--- | :--- | :--- | :--- | :--- | :--- |',
    ...rows,
    '',
    '## Missing Evidence',
    '',
    ...comparisonMatrix.flatMap(item => {
      if (item.missingEvidence.length === 0) return [`- ${item.axis}: none`];
      return [`- ${item.axis}: ${item.missingEvidence.join(', ')}`];
    }),
    '',
    '## Artifact Hashes',
    '',
    ...artifacts.map(artifact => `- ${path.basename(artifact.path)}: ${artifact.sha256}`)
  ].join('\n');
}

function methodStatusFromEvidence(evidence) {
  return evidence.every(item => item.status === 'pass') ? 'upgraded' : 'provisional';
}

function buildBeforeAfterMethodMatrix({ summary, comparisonMatrix, consoleApiTransport }) {
  const offlinePass = comparisonMatrix.every(item => item.offlineStatus === 'pass');
  const anySelectedLive = comparisonMatrix.some(item => item.selectedStatus === 'ok');
  const anyClaudeLive = comparisonMatrix.some(item => item.claudeStatus === 'ok');
  const consoleTransportProven = Boolean(consoleApiTransport && consoleApiTransport.requested && ['ok', 'auth_required'].includes(consoleApiTransport.status));
  const hashProof = summary && summary.minimumScore >= summary.threshold;

  const rows = [
    {
      axis: 'routing',
      before: 'Model-name focused routing could turn the comparison into provider preference.',
      after: 'Selected-model preservation plus method contract; Aether console can run the chosen model without changing the benchmark target.',
      delta: 'from model contest to selected-model deterministic adaptation',
      evidence: [
        { status: 'pass', artifact: 'readiness.json', proof: 'selected model readiness is separated from baseline readiness' },
        { status: consoleTransportProven ? 'pass' : 'partial', artifact: 'console_api_transport.json', proof: consoleTransportProven ? 'console/API transport proof exists' : 'console transport was not requested or did not prove a transport boundary' }
      ]
    },
    {
      axis: 'deep_reasoning',
      before: 'Generic reasoning prompt with weak proof boundaries.',
      after: 'Axis protocol requires hypotheses, disconfirming evidence, counterexamples, second-order effects, decision, and residual risk.',
      delta: 'from fluent reasoning to auditable reasoning protocol',
      evidence: [
        { status: offlinePass ? 'pass' : 'partial', artifact: 'transcripts.json', proof: 'offline contract injects required axis protocol' }
      ]
    },
    {
      axis: 'code_review',
      before: 'Single-pass review could miss severity ordering, regressions, and test gaps.',
      after: 'Review pass count, severity ranking, regression scan, concrete evidence, and residual-risk guard are required.',
      delta: 'from review text to review gate',
      evidence: [
        { status: offlinePass ? 'pass' : 'partial', artifact: 'scores.json', proof: 'code-review checks are scored against deterministic requirements' }
      ]
    },
    {
      axis: 'long_context',
      before: 'Large-context handling relied on broad memory claims.',
      after: 'Context map, source anchors, refreshed assumptions, and checkpoints are part of the proof schema.',
      delta: 'from memory confidence to anchored context management',
      evidence: [
        { status: offlinePass ? 'pass' : 'partial', artifact: 'transcripts.json', proof: 'long-context scenario requires source anchors and checkpoints' }
      ]
    },
    {
      axis: 'tool_calling',
      before: 'Tool use could be described in prose without schema reconciliation.',
      after: 'Tool intent, selected tool, valid JSON/schema arguments, evidence, reconciliation, and residual risk are required.',
      delta: 'from prose tool intent to schema-first MCP behavior',
      evidence: [
        { status: offlinePass ? 'pass' : 'partial', artifact: 'comparison_matrix.json', proof: 'tool-call axes are scored with target thresholds' }
      ]
    },
    {
      axis: 'agentic_persistence',
      before: 'Persistence was hard to distinguish from repeated attempts.',
      after: 'Checkpoint, retry budget, blocker audit, changed tactics, next action, and residual risk are required.',
      delta: 'from retrying to audited persistence',
      evidence: [
        { status: offlinePass ? 'pass' : 'partial', artifact: 'scores.json', proof: 'persistence axis passes deterministic checks when threshold is met' }
      ]
    },
    {
      axis: 'artifact_discipline',
      before: 'Success language could outrun evidence.',
      after: 'No direct victory claim unless live selected response, live baseline, thresholds, artifacts, and hashes all exist.',
      delta: 'from assertion to artifact-gated certification',
      evidence: [
        { status: hashProof ? 'pass' : 'partial', artifact: 'artifact_hashes.json', proof: 'artifact set is hashed after generation' },
        { status: summary.directVictoryProven ? 'pass' : 'partial', artifact: 'summary.json', proof: summary.directVictoryProven ? 'direct victory was proven on completed live axes' : 'direct victory intentionally withheld without complete fresh baseline' }
      ]
    },
    {
      axis: 'opus_4_6_comparison',
      before: 'Comparison could be implied without fresh baseline.',
      after: 'Claude Opus 4.6 remains only a baseline lane; without fresh baseline artifacts the claim stays provisional.',
      delta: 'from implied win to explicit non-certification when evidence is missing',
      evidence: [
        { status: anyClaudeLive ? 'pass' : 'partial', artifact: 'live_comparisons.json', proof: anyClaudeLive ? 'fresh baseline response exists' : 'baseline is missing, so no direct win is claimed' },
        { status: anySelectedLive ? 'pass' : 'partial', artifact: 'live_comparisons.json', proof: anySelectedLive ? 'selected model response exists' : 'selected live response is missing or not requested' }
      ]
    }
  ];

  return rows.map(row => ({
    ...row,
    status: methodStatusFromEvidence(row.evidence)
  }));
}

function buildBeforeAfterMethodReport({ summary, beforeAfterMethodMatrix }) {
  const upgraded = beforeAfterMethodMatrix.filter(item => item.status === 'upgraded').length;
  const provisional = beforeAfterMethodMatrix.length - upgraded;
  const claim = summary.directVictoryProven
    ? 'Direct baseline victory is certified for the completed live evidence set.'
    : 'No direct Claude Opus 4.6 victory is claimed; the certified result is method-threshold readiness only.';

  const rows = beforeAfterMethodMatrix.map(item => markdownTableRow([
    item.axis,
    item.status,
    item.before,
    item.after,
    item.delta,
    item.evidence.map(evidence => `${evidence.artifact}:${evidence.status}`).join('; ')
  ]));

  return [
    '# TheSource Before/After Method Comparison',
    '',
    `Generated: ${summary.generatedAt}`,
    `Selected execution model: ${summary.selectedModel}`,
    `Baseline lane: ${summary.baselineModel}`,
    `Method threshold: ${summary.threshold}`,
    `Minimum method score: ${summary.minimumScore}`,
    `Upgraded axes: ${upgraded}/${beforeAfterMethodMatrix.length}`,
    `Provisional axes: ${provisional}/${beforeAfterMethodMatrix.length}`,
    `Claim: ${claim}`,
    '',
    '| Axis | Status | Before | After | Atomic delta | Evidence |',
    '| :--- | :--- | :--- | :--- | :--- | :--- |',
    ...rows,
    '',
    '## Certification Rule',
    '',
    'A method upgrade can pass offline threshold validation, but direct superiority over the baseline lane remains provisional until fresh baseline artifacts exist for every requested axis.'
  ].join('\n');
}

function appendShadowLedgerArtifacts(artifacts, summary) {
  if (!WRITE_LEDGER) return null;
  const ledgerPath = path.join(ROOT, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  const timestamp = new Date().toISOString();
  const entries = artifacts.map(artifact => ({
    timestamp,
    action: 'ModelAdaptationArtifact',
    status: summary.passed ? 'PASS' : 'FAIL',
    artifact: path.relative(ROOT, artifact.path).replace(/\\/g, '/'),
    sha256: artifact.sha256,
    bytes: artifact.bytes,
    selectedModel: summary.selectedModel,
    baselineModel: summary.baselineModel,
    directVictoryProven: summary.directVictoryProven,
    claim: summary.claim
  }));
  fs.appendFileSync(ledgerPath, `${entries.map(entry => JSON.stringify(entry)).join('\n')}\n`, 'utf8');
  const ledgerContent = fs.readFileSync(ledgerPath, 'utf8');
  return {
    path: ledgerPath,
    sha256: sha256(ledgerContent),
    entriesWritten: entries.length
  };
}

async function callClaudeBaseline(scenario) {
  if (OFFLINE || !WANT_CLAUDE_BASELINE) return { status: 'skipped' };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { status: 'missing_key', env: 'ANTHROPIC_API_KEY' };
  }

  const tools = anthropicToolsFromScenario(scenario);
  const body = {
    model: CLAUDE_BASELINE_MODEL,
    max_tokens: Number(process.env.ANTHROPIC_BASELINE_MAX_TOKENS || 1200),
    temperature: 0.2,
    system: 'Answer as a direct baseline. Do not mention hidden reasoning. Obey the requested JSON proof schema exactly.',
    messages: scenario.messages
  };
  if (tools.length > 0) body.tools = tools;

  const startedAt = new Date().toISOString();
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { raw }; }
  const text = response.ok ? responseTextFromAnthropic(data) : raw.slice(0, 1000);
  return {
    status: response.ok ? 'ok' : 'error',
    provider: 'anthropic',
    model: CLAUDE_BASELINE_MODEL,
    startedAt,
    endedAt: new Date().toISOString(),
    httpStatus: response.status,
    outputHash: sha256(text),
    outputBytes: Buffer.byteLength(text),
    score: scoreLiveResponse(scenario.axis, text),
    output: text
  };
}

function callAetherConsoleSelected(scenario, contract) {
  const liveModel = scenario.model === 'local/unknown-model' ? SELECTED_MODEL : scenario.model;
  const prompt = aetherConsolePromptForScenario(scenario);
  const startedAt = new Date().toISOString();
  const result = runCli('powershell', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', path.join(ROOT, 'aether.ps1'),
    'console',
    `--model=${liveModel}`,
    '-p', prompt,
    '--output-format', 'json',
    '--no-session-persistence',
    '--permission-mode', 'dontAsk',
    '--tools', '""'
  ], '', Number(process.env.AETHER_MODEL_ADAPTATION_AETHER_TIMEOUT_MS || 120000));
  const raw = redactSecrets(`${result.stdout}${result.stderr ? `\n${result.stderr}` : ''}`).trim();
  const extracted = extractJsonLine(raw, scenario.axis);
  const text = extracted.text || raw.slice(-4000);
  return {
    status: result.status === 0 && extracted.text ? 'ok' : 'console_error',
    provider: 'aether-console',
    model: liveModel,
    startedAt,
    endedAt: new Date().toISOString(),
    exitCode: result.status,
    signal: result.signal,
    outputHash: sha256(text),
    outputBytes: Buffer.byteLength(text),
    transcriptHash: sha256(raw),
    transcriptBytes: Buffer.byteLength(raw),
    score: scoreLiveResponse(scenario.axis, text),
    output: text,
    transcriptPreview: raw.slice(0, 1500),
    error: result.error
  };
}

async function callSelectedLive(scenario, contract) {
  if (OFFLINE || !WANT_SELECTED_LIVE) return { status: 'skipped' };
  if (USE_AETHER_CONSOLE) return callAetherConsoleSelected(scenario, contract);
  const liveModel = scenario.model === 'local/unknown-model' ? SELECTED_MODEL : scenario.model;
  const { RelayBridge } = require('../relay_bridge.js');
  const bridge = new RelayBridge();
  if (!bridge.apiKey) {
    if (USE_CONSOLE_API) {
      return {
        status: 'api_url_transport_only',
        provider: 'console-api-url',
        model: liveModel,
        reason: 'Console/API URL transport is probed as an artifact, but no model response was produced through the relay.'
      };
    }
    return { status: 'missing_key', provider: bridge.provider, model: liveModel };
  }

  const startedAt = new Date().toISOString();
  try {
    const result = await bridge.createPulse({
      model: liveModel,
      messages: scenario.messages,
      system: contract,
      max_tokens: Number(process.env.AETHER_MODEL_ADAPTATION_MAX_TOKENS || 1200),
      temperature: 0.2,
      tools: scenario.tools
    });
    const text = responseTextFromRelay(result);
    return {
      status: 'ok',
      provider: bridge.provider,
      model: result.model || liveModel,
      startedAt,
      endedAt: new Date().toISOString(),
      outputHash: sha256(text),
      outputBytes: Buffer.byteLength(text),
      score: scoreLiveResponse(scenario.axis, text),
      output: text
    };
  } catch (error) {
    return {
      status: 'error',
      provider: bridge.provider,
      model: liveModel,
      startedAt,
      endedAt: new Date().toISOString(),
      error: String(error && error.message ? error.message : error).slice(0, 1000)
    };
  }
}

async function main() {
  ensureDir(OUT_DIR);
  if (scenarios.length === 0) {
    throw new Error(`No benchmark scenarios selected. Requested axes: ${[...AXIS_FILTER].join(', ') || 'none'}`);
  }

  const readiness = battleReadiness();
  const consoleApiTransport = await probeConsoleApiTransport();
  const transcripts = scenarios.map(scoreScenario);
  const liveComparisons = [];
  for (const transcript of transcripts) {
    const scenario = scenarios.find(item => item.axis === transcript.axis);
    const [selected, claude] = await Promise.all([
      callSelectedLive(scenario, transcript.contract),
      callClaudeBaseline(scenario)
    ]);
    const directVictory =
      selected.status === 'ok' &&
      claude.status === 'ok' &&
      selected.score.score >= claude.score.score &&
      selected.score.score >= (OPUS_CHALLENGER_TARGETS[scenario.axis] || 95);
    liveComparisons.push({
      axis: scenario.axis,
      selected,
      claude,
      directVictory
    });
  }
  const scores = transcripts.map(({ axis, model, provider, score, checks }) => ({
    axis,
    model,
    provider,
    score,
    failedChecks: checks.filter(check => !check.pass).map(check => check.name)
  }));
  const minimumScore = Math.min(...scores.map(item => item.score));
  const threshold = Number(process.env.AETHER_MODEL_ADAPTATION_THRESHOLD || 98);
  const completedLiveComparisons = liveComparisons.filter(item => item.selected.status === 'ok' && item.claude.status === 'ok');
  const directVictoryProven = completedLiveComparisons.length > 0 && completedLiveComparisons.every(item => item.directVictory);
  const liveBattleRequested = !OFFLINE && WANT_CLAUDE_BASELINE && WANT_SELECTED_LIVE;
  const passed = liveBattleRequested
    ? minimumScore >= threshold && completedLiveComparisons.length === scenarios.length && directVictoryProven
    : minimumScore >= threshold;
  const liveBaselineStatus =
    completedLiveComparisons.length === scenarios.length
      ? 'complete'
      : completedLiveComparisons.length > 0
        ? 'partial'
        : (OFFLINE || !WANT_CLAUDE_BASELINE || !WANT_SELECTED_LIVE ? 'not_requested' : 'missing_or_failed');
  const summary = {
    generatedAt: new Date().toISOString(),
    mode: OFFLINE ? 'offline-contract-validation' : 'live-ready-contract-validation',
    selectedModel: SELECTED_MODEL,
    threshold,
    opusChallengerTargets: OPUS_CHALLENGER_TARGETS,
    minimumScore,
    passed,
    liveBattleRequested,
    liveBaselineStatus,
    directVictoryProven,
    baselineModel: CLAUDE_BASELINE_MODEL,
    readiness,
    consoleApiTransport,
    claim:
      directVictoryProven
        ? 'direct-victory-proven: selected TheSource-adapted model matched or exceeded Claude baseline on completed live axes'
        : completedLiveComparisons.length > 0
          ? 'partial-live-baseline: do not claim full Claude Opus victory until all axes complete'
        : 'threshold-validation-only: do not claim direct Claude Opus victory without fresh baseline artifacts',
    axes: ATOMIC_AXES,
    selectedAxes: scenarios.map(scenario => scenario.axis)
  };
  const comparisonMatrix = buildComparisonMatrix({
    transcripts,
    liveComparisons,
    threshold,
    liveBattleRequested
  });
  const beforeAfterMethodMatrix = buildBeforeAfterMethodMatrix({
    summary,
    comparisonMatrix,
    consoleApiTransport
  });

  const artifacts = [
    writeJson('summary.json', summary),
    writeJson('scores.json', scores),
    writeJson('transcripts.json', transcripts),
    writeJson('readiness.json', readiness),
    writeJson('console_api_transport.json', consoleApiTransport),
    writeJson('live_comparisons.json', liveComparisons),
    writeJson('comparison_matrix.json', comparisonMatrix),
    writeJson('before_after_method_matrix.json', beforeAfterMethodMatrix)
  ];
  artifacts.push(writeText('comparison_report.md', buildComparisonReport({ summary, comparisonMatrix, artifacts })));
  artifacts.push(writeText('before_after_method_report.md', buildBeforeAfterMethodReport({ summary, beforeAfterMethodMatrix })));
  const hashArtifact = writeJson('artifact_hashes.json', artifacts);
  const ledger = appendShadowLedgerArtifacts([...artifacts, hashArtifact], summary);

  console.error(JSON.stringify({
    status: summary.passed ? 'PASS' : 'FAIL',
    outputDir: OUT_DIR,
    summary,
    artifacts: [...artifacts, hashArtifact],
    ledger
  }, null, 2));

  if (!summary.passed) process.exit(1);
}

main().catch(error => {
  console.error(JSON.stringify({
    status: 'ERROR',
    error: String(error && error.message ? error.message : error)
  }, null, 2));
  process.exit(1);
});
