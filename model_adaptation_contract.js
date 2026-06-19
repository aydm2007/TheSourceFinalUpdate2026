// model_adaptation_contract.js - TheSource deterministic model adaptation layer.
// This layer is intentionally model-agnostic: it strengthens any selected model
// with a repeatable execution/review/evidence contract instead of depending on
// a single vendor model.

const ATOMIC_AXES = Object.freeze([
  'deep_reasoning',
  'tool_calling',
  'natural_tool_calling',
  'mcp_compliance',
  'repo_debugging',
  'code_review',
  'long_context',
  'agentic_persistence',
  'security',
  'ui_proof',
  'artifact_discipline',
  'retry_failover',
  'instruction_following'
]);

function normalizeModelId(model) {
  return String(model || '').trim();
}

function lowerModelId(model) {
  return normalizeModelId(model).toLowerCase();
}

function isExplicitExternalModel(model) {
  const value = lowerModelId(model);
  if (!value) return false;
  if (value.includes('/')) return true;
  if (value.includes(':')) return true;
  return /^(gpt-|o\d|claude-|gemini-|deepseek-|qwen-|llama-|mistral-|kimi-)/i.test(value);
}

const OPUS_CHALLENGER_TARGETS = Object.freeze({
  deep_reasoning: 98,
  code_review: 98,
  long_context: 98,
  agentic_persistence: 97,
  natural_tool_calling: 97
});

function shouldPreserveModelForProvider(model, provider) {
  const providerName = String(provider || '').toLowerCase();
  if (!isExplicitExternalModel(model)) return false;
  if (providerName === 'openrouter') return true;
  return false;
}

function inferProviderForModel(model, fallbackProvider = 'siliconflow') {
  const value = lowerModelId(model);
  if (!value) return fallbackProvider;
  if (value.startsWith('openai/') && value.includes(':free')) return 'openrouter';
  if (value.startsWith('openai/') || value.startsWith('gpt-') || value.startsWith('o')) return 'openai';
  if (value.startsWith('google/') || value.startsWith('gemini-')) return 'google';
  if (value.includes(':free') || value.includes('/') || value.startsWith('anthropic/')) return 'openrouter';
  if (value.startsWith('github/') || value.startsWith('azure/')) return 'github';
  return fallbackProvider;
}

function flattenMessages(messages) {
  return (messages || [])
    .map(message => {
      if (!message) return '';
      const content = message.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content.map(part => part.text || part.content || '').join('\n');
      }
      return JSON.stringify(content || '');
    })
    .join('\n')
    .toLowerCase();
}

function inferTaskAxis({ messages = [], tools = [] } = {}) {
  const text = flattenMessages(messages);
  const hasTools = Array.isArray(tools) && tools.length > 0;

  if (/\b(deep reasoning|reason deeply|raw reasoning|hypothesis|counterexample|second-order|causal)\b/.test(text)) return 'deep_reasoning';
  if (/\b(persist|persistence|long-running|autonomous|checkpoint|resume|blocked|blocker audit|retry budget)\b/.test(text)) return 'agentic_persistence';
  if (/\b(security|secret|auth|vulnerability|exploit|audit|zero-trust)\b/.test(text)) return 'security';
  if (/\b(review|edge case|regression|risk|bug risk|code review)\b/.test(text)) return 'code_review';
  if (/\b(ui|dom|screenshot|accessibility|visual|canvas)\b/.test(text)) return 'ui_proof';
  if (/\b(retry|failover|fallback|rate limit|429|503|circuit)\b/.test(text)) return 'retry_failover';
  if (/\b(long context|source map|cli\.js\.map|large repo|context)\b/.test(text)) return 'long_context';
  if (hasTools && /\b(natural|tool intent|schema|arguments|json|call)\b/.test(text)) return 'natural_tool_calling';
  if (/\b(debug|fix|patch|test|vitest|terminal|bash|mcp)\b/.test(text)) return 'repo_debugging';
  if (hasTools) return 'tool_calling';
  if (/\b(artifact|evidence|hash|ledger|transcript|proof)\b/.test(text)) return 'artifact_discipline';
  return 'instruction_following';
}

function getModelExecutionProfile(model) {
  const value = lowerModelId(model);
  const explicit = isExplicitExternalModel(model);
  const likelyStrong = explicit && /(gpt|opus|claude|gemini|deepseek|qwen|llama|mistral|kimi)/.test(value);
  return {
    model: normalizeModelId(model),
    explicit,
    likelyStrong,
    executionMode: 'opus_challenger_deterministic',
    minimumReviewPasses: likelyStrong ? 3 : 4,
    challengerAxes: Object.keys(OPUS_CHALLENGER_TARGETS),
    requiresToolJsonGuard: true,
    requiresEvidenceGuard: true,
    preservesRequestedModel: explicit
  };
}

function getAxisProtocol(axis) {
  const protocols = {
    deep_reasoning: [
      'Deep reasoning protocol: produce a concise decision record, not hidden chain-of-thought.',
      'Enumerate at least three hypotheses, disconfirming evidence, counterexamples, and second-order effects before deciding.',
      'State the strongest opposing interpretation and why the final decision survives it.'
    ],
    code_review: [
      'Code review protocol: run two passes, first for correctness bugs and regressions, second for tests, edge cases, and behavioral drift.',
      'Rank findings by severity and tie each finding to evidence, expected behavior, and the smallest proving test.',
      'Do not summarize before findings when asked for review.'
    ],
    long_context: [
      'Long-context protocol: build a source map of relevant files, preserve anchors, and refresh assumptions when context may be stale.',
      'Prefer cited local evidence over memory; mark missing context explicitly and avoid broad claims from narrow reads.',
      'Use compaction checkpoints that preserve decisions, blockers, artifacts, and validation status.'
    ],
    agentic_persistence: [
      'Agentic persistence protocol: maintain a bounded work loop with checkpoints, retry budget, next action, and blocker audit.',
      'Continue through implementation and verification when tools are available; stop only for real blockers or completed proof.',
      'After each failed attempt, change the tactic and record what evidence changed.'
    ],
    natural_tool_calling: [
      'Natural tool-calling protocol: translate user intent into the minimal valid tool call, validate schema, execute, then reconcile tool output.',
      'Never invent tools, parameters, files, command results, or artifact hashes.',
      'If a tool is denied or unavailable, report the exact denial and choose the next compliant tool path.'
    ],
    tool_calling: [
      'Tool calling protocol: prefer dedicated MCP/file/search tools over shell bypasses and preserve exact tool evidence.',
      'Validate JSON arguments before calling tools and reconcile every tool result before the final answer.'
    ],
    security: [
      'Security protocol: redact secrets, distinguish auth proof from secret value, and require fresh evidence for certification claims.',
      'Identify exploitability, blast radius, and minimum fix without printing sensitive material.'
    ],
    repo_debugging: [
      'Repo debugging protocol: reproduce first, patch narrowly, rerun the exact failing check, then broaden validation.',
      'Never revert unrelated user changes.'
    ],
    artifact_discipline: [
      'Artifact protocol: every certification claim requires transcript, exit code, timestamp, hash, and residual risk.',
      'Missing artifacts mean provisional status, not success.'
    ],
    mcp_compliance: [
      'MCP compliance protocol: use bridge-approved tools, honor active skill filters, and record denied-access proof when blocked.',
      'Do not bypass MCP governance to manufacture evidence.'
    ],
    ui_proof: [
      'UI proof protocol: require DOM, accessibility tree, screenshot, source-map linkage, and hashes for visual claims.',
      'Do not infer rendered correctness from static code only.'
    ],
    retry_failover: [
      'Retry/failover protocol: rotate keys/providers only on explicit rate-limit, auth, or availability signals.',
      'Do not leak keys in retry logs; preserve provider/model metadata.'
    ],
    instruction_following: [
      'Instruction following protocol: preserve user scope, obey output contracts, and state any unavoidable uncertainty.',
      'Do not redefine success around a smaller task.'
    ]
  };
  return protocols[axis] || protocols.instruction_following;
}

function buildDeterministicExecutionContract({ model, provider, axis, usesTools = false } = {}) {
  const profile = getModelExecutionProfile(model);
  const taskAxis = axis || inferTaskAxis({});
  const axisProtocol = getAxisProtocol(taskAxis);
  const challengerTarget = OPUS_CHALLENGER_TARGETS[taskAxis];
  const toolRule = usesTools
    ? 'Tool calls must be valid JSON matching the provided schema; never invent tool names or bypass dedicated tools.'
    : 'When tools are unavailable, produce an auditable plan and identify missing evidence instead of pretending execution happened.';

  return [
    '# TheSource Deterministic Execution Contract',
    `Model: ${profile.model || 'unspecified'} | Provider: ${provider || 'auto'} | Axis: ${taskAxis}`,
    'Objective: upgrade the selected model into an Opus-challenger deterministic executor through process, review, persistence, and evidence.',
    challengerTarget ? `Axis target: meet or exceed Opus-class threshold ${challengerTarget}/100 with artifacts before claiming victory.` : 'Axis target: pass TheSource deterministic threshold with artifacts before claiming victory.',
    'Required loop: intent extraction -> constraints -> minimal action plan -> execution/tool request -> self-review -> evidence -> residual risk.',
    `Review passes required before final answer: ${profile.minimumReviewPasses}.`,
    ...axisProtocol,
    toolRule,
    'Never replace the user-selected model solely for convenience; adapt it first, then use provider fallback only when the selected provider cannot serve it.',
    'Never claim superiority, certification, or 100/100 without fresh artifacts, hashes, and validation output.',
    'Final responses must separate findings, evidence, changes, verification, score, and remaining risk when certification is discussed.'
  ].join('\n');
}

function applyDeterministicContract({ messages = [], system, model, provider, axis, tools = [] } = {}) {
  const contract = buildDeterministicExecutionContract({
    model,
    provider,
    axis: axis || inferTaskAxis({ messages, tools }),
    usesTools: Array.isArray(tools) && tools.length > 0
  });
  const systemContent = system ? `${system}\n\n${contract}` : contract;
  return [{ role: 'system', content: systemContent }, ...(messages || [])];
}

function selectExecutionPolicy({ model, messages = [], tools = [], fallbackProvider = 'siliconflow' } = {}) {
  const axis = inferTaskAxis({ messages, tools });
  const providerHint = inferProviderForModel(model, fallbackProvider);
  const profile = getModelExecutionProfile(model);
  const target = OPUS_CHALLENGER_TARGETS[axis] || 95;
  return {
    axis,
    providerHint,
    profile,
    temperature: ['deep_reasoning', 'code_review', 'security', 'long_context'].includes(axis) ? 0.15 : 0.3,
    maxReviewPasses: profile.minimumReviewPasses + (OPUS_CHALLENGER_TARGETS[axis] ? 1 : 0),
    opusChallengerTarget: target,
    evidenceRequired: true
  };
}

module.exports = {
  ATOMIC_AXES,
  OPUS_CHALLENGER_TARGETS,
  applyDeterministicContract,
  buildDeterministicExecutionContract,
  getAxisProtocol,
  getModelExecutionProfile,
  inferProviderForModel,
  inferTaskAxis,
  isExplicitExternalModel,
  normalizeModelId,
  selectExecutionPolicy,
  shouldPreserveModelForProvider
};
