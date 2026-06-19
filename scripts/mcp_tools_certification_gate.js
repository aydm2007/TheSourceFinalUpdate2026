#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

try {
  require('dotenv').config();
} catch (_) {}

const root = path.resolve(__dirname, '..');
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const evidenceDir = path.join(root, 'reports', 'mcp-tools-100', runId);
const ledgerPath = path.join(root, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
const strict = process.argv.includes('--strict');
const full = process.argv.includes('--full');
const skipGates = process.argv.includes('--no-gates');
const skipMapTools = process.argv.includes('--no-map-tools');

fs.mkdirSync(evidenceDir, { recursive: true });

const artifacts = [];

function now() {
  return new Date().toISOString();
}

function commandName(name) {
  if (process.platform === 'win32' && (name === 'npm' || name === 'npx')) return `${name}.cmd`;
  return name;
}

function redact(value) {
  return String(value || '')
    .replace(/(Authorization\s*:\s*Bearer\s+)[^\s'"]+/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]{12,}/g, '$1[REDACTED]')
    .replace(/\b(?:sk-ant-[A-Za-z0-9._-]{12,}|sk-proj-[A-Za-z0-9._-]{12,}|sk-[A-Za-z0-9._-]{20,}|xai-[A-Za-z0-9._-]{12,}|ghp_[A-Za-z0-9_]{20,}|gsk_[A-Za-z0-9._-]{12,}|AIza[A-Za-z0-9._-]{20,})\b/g, '[REDACTED_SECRET]')
    .replace(/((?:AETHER_MCP_API_KEY|NEXUS_API_KEY|MCP_API_KEY|API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY)\s*=\s*)[^\s]+/gi, '$1[REDACTED]');
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function relative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function registerArtifact(filePath, kind) {
  if (!fs.existsSync(filePath)) return null;
  const stat = fs.statSync(filePath);
  const artifact = {
    path: relative(filePath),
    kind,
    bytes: stat.size,
    sha256: sha256File(filePath),
  };
  const existingIndex = artifacts.findIndex(item => item.path === artifact.path);
  if (existingIndex >= 0) artifacts[existingIndex] = artifact;
  else artifacts.push(artifact);
  return artifact;
}

function writeText(name, text, kind = 'text') {
  const filePath = path.join(evidenceDir, name);
  fs.writeFileSync(filePath, text, 'utf8');
  return registerArtifact(filePath, kind);
}

function writeJson(name, payload, kind = 'json') {
  return writeText(name, JSON.stringify(payload, null, 2), kind);
}

function appendLedger(record) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.appendFileSync(ledgerPath, JSON.stringify({
    timestamp: now(),
    type: 'mcp_tools_100_certification',
    action: 'mcp_tools_certification_gate',
    runId,
    ...record,
  }) + '\n', 'utf8');
}

function envSummary() {
  const keys = [
    'AETHER_MCP_API_KEY',
    'NEXUS_API_KEY',
    'MCP_API_KEY',
    'API_KEY',
    'AETHER_MCP_BASE_URL',
    'AETHER_MCP_PROJECT',
    'AETHER_RUN_VITEST',
  ];
  return {
    generatedAt: now(),
    workspaceRoot: root,
    runId,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    env: Object.fromEntries(keys.map(key => [key, {
      present: Boolean(process.env[key]),
      value: /KEY|TOKEN|SECRET/i.test(key) && process.env[key] ? '[REDACTED]' : (process.env[key] || null),
    }])),
    mcpTerminalNote: 'MCP terminal execution may be policy-gated in some IDE sessions; this gate records native command transcripts as artifacts.',
  };
}

function runCommand(label, command, args, options = {}) {
  const startedAt = now();
  const started = Date.now();
  const useCmdShim = process.platform === 'win32' && (command === 'npm' || command === 'npx');
  const result = spawnSync(
    useCmdShim ? (process.env.ComSpec || 'cmd.exe') : commandName(command),
    useCmdShim ? ['/d', '/s', '/c', [command, ...args].join(' ')] : args,
    {
      cwd: root,
      encoding: 'utf8',
      timeout: options.timeoutMs || 180000,
      shell: false,
      env: { ...process.env, ...(options.env || {}) },
    }
  );
  const endedAt = now();
  const transcript = {
    label,
    command: [command, ...args].join(' '),
    startedAt,
    endedAt,
    durationMs: Date.now() - started,
    exitCode: result.status,
    signal: result.signal || null,
    error: result.error ? redact(result.error.message) : null,
    stdout: redact(result.stdout || ''),
    stderr: redact(result.stderr || ''),
  };
  writeText(`${label}.log`, JSON.stringify(transcript, null, 2), 'command-log');
  return transcript;
}

function parseJsonFromOutput(text) {
  const source = String(text || '');
  const indexes = [];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '{') indexes.push(i);
  }
  for (const index of indexes) {
    try {
      return JSON.parse(source.slice(index));
    } catch (_) {}
  }
  return null;
}

function commandJson(commandResult) {
  return parseJsonFromOutput(`${commandResult.stdout || ''}\n${commandResult.stderr || ''}`);
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (_) {
    return null;
  }
}

function artifactExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

async function collectMcpResources() {
  const handlers = require('../core/bridge/handlers/lsp_handlers.js');
  const context = { __dirname: root };
  const listed = JSON.parse(await handlers.ListMcpResources({}, context));
  const genericUris = [
    'mcp://tool-registry',
    'mcp://latest-gates',
    'mcp://forensic-reports',
    'mcp://source-map',
    'mcp://shadow-ledger',
  ];
  const reads = {};
  for (const uri of genericUris) {
    const raw = await handlers.ReadMcpResource({ uri }, context);
    try {
      reads[uri] = JSON.parse(raw);
    } catch (_) {
      reads[uri] = { rawPreview: String(raw).slice(0, 500) };
    }
  }
  return {
    listed,
    genericUris,
    genericPresent: genericUris.every(uri => listed.resources.some(resource => resource.uri === uri)),
    reads,
  };
}

async function collectSourceMapToolProofs(cliMapEvidence) {
  const mapPath = path.join(root, 'package', 'cli.js.map');
  const proofs = {
    mapPath: relative(mapPath),
    verifyCliMap: cliMapEvidence,
    remoteMapDecoder: { status: 'not_run' },
    vectorAstMapper: { status: 'not_run' },
    mapDrivenOptimizer: { status: 'not_run' },
    visualDomMapper: { status: 'not_run' },
  };

  if (skipMapTools) {
    proofs.skipped = true;
    proofs.skipReason = '--no-map-tools';
    return proofs;
  }

  const engine = require('../core/security/sovereign_engine.js');
  const stack = 'Error: source map probe\n    at sample (package/cli.js:8:1924)';
  try {
    const frames = await engine.realDecodeStackTrace(stack, mapPath);
    proofs.remoteMapDecoder = {
      status: frames.some(frame => frame.original && frame.original.source) ? 'pass' : 'partial',
      frames,
      mapAnchor: frames.find(frame => frame.original && frame.original.source) || null,
    };
  } catch (error) {
    proofs.remoteMapDecoder = { status: 'error', message: error.message };
  }

  try {
    const result = await engine.realBuildAstIndex(mapPath);
    proofs.vectorAstMapper = result;
  } catch (error) {
    proofs.vectorAstMapper = { status: 'error', message: error.message };
  }

  try {
    const result = await engine.realDeadCodeAnalysis(mapPath);
    proofs.mapDrivenOptimizer = {
      status: result.total_sources === 4756 ? 'optimized' : 'partial',
      total_sources: result.total_sources,
      used_sources: result.used_sources,
      dead_sources_count: Array.isArray(result.dead_sources) ? result.dead_sources.length : null,
      dead_ratio_percent: result.dead_ratio_percent,
    };
  } catch (error) {
    proofs.mapDrivenOptimizer = { status: 'error', message: error.message };
  }

  try {
    const result = await engine.realVisualDomMap(mapPath);
    proofs.visualDomMapper = {
      status: result.status || 'unknown',
      total_mapped: result.total_mapped,
      content_analyzed: result.content_analyzed,
      components: result.components,
      hooks: result.hooks,
      pages: result.pages,
      stores: result.stores,
      utils: result.utils,
      mode: 'static_sourcemap_topology',
      limitation: 'Static topology is not runtime DOM/accessibility/screenshot proof.',
    };
  } catch (error) {
    proofs.visualDomMapper = { status: 'error', message: error.message };
  }

  return proofs;
}

function commandStatus(result) {
  if (!result) return 'not_run';
  if (result.exitCode === 0) return 'pass';
  if (result.error && /timed out/i.test(result.error)) return 'timeout';
  return 'fail';
}

function scoreEvidence(evidence) {
  const native = evidence.gates.nativeMcp.parsed || {};
  const streamable = native.http && native.http.authenticated ? native.http.authenticated.streamableHttp : {};
  const allTools = native.http && native.http.authenticated ? native.http.authenticated.allTools : {};
  const metrics = native.http && native.http.authenticated ? native.http.authenticated.metrics : {};
  const sse = native.http && native.http.authenticated ? native.http.authenticated.mcpSse : {};
  const filtering = native.toolFiltering || {};
  const sourceMap = evidence.sourceMapToolProofs || {};
  const cliMap = evidence.gates.cliMap.parsed || {};
  const toolAlignment = evidence.toolSourceAlignment || {};
  const agentSwarmAlignment = evidence.agentSwarmAlignment || {};
  const resources = evidence.mcpResources || {};

  const matrix = {
    toolInventorySchema: 0,
    authRbacSkillFiltering: 0,
    streamableHttpSseMetricsAdmin: 0,
    mcpResourcesReadResources: 0,
    sourceMapGpsProof: 0,
    forensicAuditReporting: 0,
    swarmAgentProof: 0,
    artifactLedgerDiscipline: 0,
  };

  if (resources.genericPresent) matrix.toolInventorySchema += 3;
  if (resources.reads && resources.reads['mcp://tool-registry'] && resources.reads['mcp://tool-registry'].declaredAllowedTools > 0) matrix.toolInventorySchema += 3;
  if (artifactExists('bridge.json')) matrix.toolInventorySchema += 2;
  if (toolAlignment.status === 'pass' && toolAlignment.coverage && toolAlignment.coverage.projectAnchoredTools === toolAlignment.coverage.bridgeTools) matrix.toolInventorySchema += 2;

  if (native.http && (native.http.unauthMetricsDenied || native.http.unauthMcpDenied)) matrix.authRbacSkillFiltering += 4;
  if (filtering.bootstrap && filtering.bootstrap.ok) matrix.authRbacSkillFiltering += 4;
  if (filtering.authorization && filtering.authorization.fileReadUnderMcpDeveloper) matrix.authRbacSkillFiltering += 3;
  if (filtering.authorization && filtering.authorization.fileWriteDeniedUnderSecurityAudit) matrix.authRbacSkillFiltering += 4;

  if (metrics.ok) matrix.streamableHttpSseMetricsAdmin += 4;
  if (sse.ok) matrix.streamableHttpSseMetricsAdmin += 4;
  if (streamable.ok) matrix.streamableHttpSseMetricsAdmin += 4;
  if (allTools.ok) matrix.streamableHttpSseMetricsAdmin += 3;

  if (resources.genericPresent) matrix.mcpResourcesReadResources += 5;
  if (resources.reads && resources.genericUris && resources.genericUris.every(uri => resources.reads[uri])) matrix.mcpResourcesReadResources += 5;

  if (String(cliMap.status || '').toLowerCase() === 'pass') matrix.sourceMapGpsProof += 5;
  if (sourceMap.remoteMapDecoder && sourceMap.remoteMapDecoder.status === 'pass') matrix.sourceMapGpsProof += 3;
  if (sourceMap.vectorAstMapper && sourceMap.vectorAstMapper.status === 'indexed' && sourceMap.vectorAstMapper.vectors_indexed > 0) matrix.sourceMapGpsProof += 3;
  if (sourceMap.mapDrivenOptimizer && sourceMap.mapDrivenOptimizer.total_sources === 4756) matrix.sourceMapGpsProof += 2;
  if (sourceMap.visualDomMapper && sourceMap.visualDomMapper.status === 'dom_mapped') matrix.sourceMapGpsProof += 2;

  if (evidence.reportArtifacts && evidence.reportArtifacts.summary) matrix.forensicAuditReporting += 4;
  if (evidence.reportArtifacts && evidence.reportArtifacts.markdown) matrix.forensicAuditReporting += 4;
  if (evidence.reportArtifacts && evidence.reportArtifacts.html) matrix.forensicAuditReporting += 4;
  if (evidence.reportArtifacts && evidence.reportArtifacts.hashes) matrix.forensicAuditReporting += 3;

  if (native.swarmDryRun && native.swarmDryRun.ok) matrix.swarmAgentProof += 5;
  if (filtering.skills && (filtering.skills.swarmCoordinatorExposed || filtering.skills.agentExposed)) matrix.swarmAgentProof += 2;
  if (agentSwarmAlignment.status === 'pass' && agentSwarmAlignment.coverage && agentSwarmAlignment.coverage.swarmToolsAnchored === agentSwarmAlignment.coverage.requiredSwarmTools) matrix.swarmAgentProof += 3;

  if (evidence.ledgerProof && evidence.ledgerProof.allArtifactsLogged) matrix.artifactLedgerDiscipline += 7;
  if (evidence.ledgerProof && evidence.ledgerProof.hashesMatch) matrix.artifactLedgerDiscipline += 3;

  matrix.toolInventorySchema = Math.min(matrix.toolInventorySchema, 10);
  matrix.authRbacSkillFiltering = Math.min(matrix.authRbacSkillFiltering, 15);
  matrix.streamableHttpSseMetricsAdmin = Math.min(matrix.streamableHttpSseMetricsAdmin, 15);
  matrix.mcpResourcesReadResources = Math.min(matrix.mcpResourcesReadResources, 10);
  matrix.sourceMapGpsProof = Math.min(matrix.sourceMapGpsProof, 15);
  matrix.forensicAuditReporting = Math.min(matrix.forensicAuditReporting, 15);
  matrix.swarmAgentProof = Math.min(matrix.swarmAgentProof, 10);
  matrix.artifactLedgerDiscipline = Math.min(matrix.artifactLedgerDiscipline, 10);

  let total = Object.values(matrix).reduce((sum, value) => sum + value, 0);
  const gates = evidence.gates || {};
  const requiredGateNames = ['testMcpIntegration', 'cliMap', 'toolSourceAlignment', 'agentSwarmAlignment', 'nativeMcp', 'globalProductionGate', 'sovereign90Sweep', 'liveUi'];
  const blockingGateFailure = requiredGateNames.some(name => gates[name] && !['pass'].includes(gates[name].status));
  const vitestFailure = gates.vitest && ['fail', 'timeout'].includes(gates.vitest.status);
  if (blockingGateFailure || vitestFailure) total = Math.min(total, 99);
  return { matrix, total };
}

function mdCell(value) {
  return String(value == null ? '' : value)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function shortHash(value) {
  return value ? `${String(value).slice(0, 12)}...` : 'see artifact_hashes.json';
}

function artifactByKind(evidence, kind) {
  return (evidence.artifacts || []).find(artifact => artifact.kind === kind) || null;
}

function artifactByName(evidence, fileName) {
  return (evidence.artifacts || []).find(artifact => artifact.path.endsWith(`/${fileName}`)) || null;
}

function artifactRef(artifact) {
  if (!artifact) return { path: 'missing', hash: 'missing' };
  return { path: artifact.path, hash: shortHash(artifact.sha256) };
}

function passFail(ok) {
  return ok ? 'pass' : 'pending';
}

function buildFindings(evidence) {
  const gates = evidence.gates || {};
  const native = gates.nativeMcp && gates.nativeMcp.parsed ? gates.nativeMcp.parsed : {};
  const http = native.http || {};
  const auth = http.authenticated || {};
  const filtering = native.toolFiltering || {};
  const cliMap = gates.cliMap && gates.cliMap.parsed ? gates.cliMap.parsed : {};
  const mapProof = evidence.sourceMapToolProofs || {};
  const resources = evidence.mcpResources || {};
  const toolAlignment = evidence.toolSourceAlignment || {};
  const agentSwarmAlignment = evidence.agentSwarmAlignment || {};
  const ledger = evidence.ledgerProof || {};
  const liveUi = gates.liveUi || {};
  const vitest = gates.vitest || {};
  const swarmDryRun = native.swarmDryRun || {};
  const skills = filtering.skills || {};
  const mapAnchor = mapProof.remoteMapDecoder && mapProof.remoteMapDecoder.mapAnchor
    ? `${mapProof.remoteMapDecoder.mapAnchor.generated.file}:${mapProof.remoteMapDecoder.mapAnchor.generated.line}:${mapProof.remoteMapDecoder.mapAnchor.generated.column} -> ${mapProof.remoteMapDecoder.mapAnchor.original.source}:${mapProof.remoteMapDecoder.mapAnchor.original.line}:${mapProof.remoteMapDecoder.mapAnchor.original.column}`
    : '';

  const refs = {
    native: artifactRef(artifactByKind(evidence, 'native-mcp-proof')),
    transport: artifactRef(artifactByKind(evidence, 'transport-proof')),
    resources: artifactRef(artifactByKind(evidence, 'mcp-resources')),
    sourceMap: artifactRef(artifactByKind(evidence, 'source-map-proof')),
    toolAlignment: artifactRef(artifactByKind(evidence, 'tool-source-alignment')),
    agentSwarm: artifactRef(artifactByKind(evidence, 'agent-swarm-alignment')),
    gates: artifactRef(artifactByKind(evidence, 'gate-proof')),
    vitest: artifactRef(artifactByName(evidence, 'vitest_after.log')),
    hashes: artifactRef(artifactByKind(evidence, 'artifact-hashes')),
    summary: artifactRef(artifactByKind(evidence, 'summary')),
  };

  return [
    {
      claim: 'Bridge tool inventory is governed and discoverable.',
      status: passFail(native.bridge && native.bridge.declaredAllowedTools > 0 && native.bridge.exposedMcpTools > 0),
      evidence: `bridge declared=${native.bridge ? native.bridge.declaredAllowedTools : 'n/a'}, exposedMcp=${native.bridge ? native.bridge.exposedMcpTools : 'n/a'}`,
      artifact: refs.native.path,
      hash: refs.native.hash,
      mapAnchor: '',
    },
    {
      claim: 'Auth, metrics, SSE, Streamable HTTP, and admin tools are live.',
      status: passFail(auth.metrics && auth.metrics.ok && auth.mcpSse && auth.mcpSse.ok && auth.streamableHttp && auth.streamableHttp.ok && auth.allTools && auth.allTools.ok),
      evidence: `metrics=${auth.metrics ? auth.metrics.statusCode : 'n/a'}, sse=${auth.mcpSse ? auth.mcpSse.contentType : 'n/a'}, transport=${auth.streamableHttp ? auth.streamableHttp.transport : 'n/a'}, adminTools=${auth.allTools ? auth.allTools.toolCount : 'n/a'}`,
      artifact: refs.transport.path,
      hash: refs.transport.hash,
      mapAnchor: '',
    },
    {
      claim: 'Unauthenticated access is denied.',
      status: passFail(http.unauthMetricsDenied && http.unauthMcpDenied),
      evidence: `unauthMetricsDenied=${Boolean(http.unauthMetricsDenied)}, unauthMcpDenied=${Boolean(http.unauthMcpDenied)}`,
      artifact: refs.native.path,
      hash: refs.native.hash,
      mapAnchor: '',
    },
    {
      claim: 'Active skill filtering and RBAC are enforced.',
      status: passFail(filtering.bootstrap && filtering.bootstrap.ok && filtering.authorization && filtering.authorization.fileWriteDeniedUnderSecurityAudit),
      evidence: `bootstrap=${filtering.bootstrap ? filtering.bootstrap.ok : 'n/a'}, securityWriteDenied=${filtering.authorization ? filtering.authorization.fileWriteDeniedUnderSecurityAudit : 'n/a'}`,
      artifact: refs.native.path,
      hash: refs.native.hash,
      mapAnchor: '',
    },
    {
      claim: 'Project-agnostic MCP resources are listed and readable.',
      status: passFail(resources.genericPresent && resources.reads && Object.keys(resources.reads).length >= 5),
      evidence: `genericPresent=${Boolean(resources.genericPresent)}, genericUris=${resources.genericUris ? resources.genericUris.length : 0}, reads=${resources.reads ? Object.keys(resources.reads).length : 0}`,
      artifact: refs.resources.path,
      hash: refs.resources.hash,
      mapAnchor: '',
    },
    {
      claim: 'Every declared bridge tool has a governed runtime source anchor.',
      status: passFail(toolAlignment.status === 'pass' && toolAlignment.coverage && toolAlignment.coverage.projectAnchoredTools === toolAlignment.coverage.bridgeTools && toolAlignment.coverage.runtimeAnchoredTools === toolAlignment.coverage.bridgeTools),
      evidence: `tools=${toolAlignment.coverage ? toolAlignment.coverage.bridgeTools : 'n/a'}, runtimeAnchored=${toolAlignment.coverage ? toolAlignment.coverage.runtimeAnchoredTools : 'n/a'}, sourceMapDirect=${toolAlignment.coverage ? toolAlignment.coverage.sourceMapAnchoredTools : 'n/a'}`,
      artifact: refs.toolAlignment.path,
      hash: refs.toolAlignment.hash,
      mapAnchor: toolAlignment.cliMap ? toolAlignment.cliMap.path : '',
    },
    {
      claim: 'All skills and required swarm tools are governed, GPS-aligned, and bridge-compatible.',
      status: passFail(agentSwarmAlignment.status === 'pass' && agentSwarmAlignment.coverage && agentSwarmAlignment.coverage.skillsWithGpsProtocol === agentSwarmAlignment.coverage.skillCount && agentSwarmAlignment.coverage.swarmToolsAnchored === agentSwarmAlignment.coverage.requiredSwarmTools),
      evidence: `skills=${agentSwarmAlignment.coverage ? agentSwarmAlignment.coverage.skillCount : 'n/a'}, gps=${agentSwarmAlignment.coverage ? agentSwarmAlignment.coverage.skillsWithGpsProtocol : 'n/a'}, swarmAnchored=${agentSwarmAlignment.coverage ? `${agentSwarmAlignment.coverage.swarmToolsAnchored}/${agentSwarmAlignment.coverage.requiredSwarmTools}` : 'n/a'}`,
      artifact: refs.agentSwarm.path,
      hash: refs.agentSwarm.hash,
      mapAnchor: agentSwarmAlignment.cliMap ? agentSwarmAlignment.cliMap.path : '',
    },
    {
      claim: 'SourceMap/GPS metadata is complete and map tools are aligned.',
      status: passFail(cliMap.metadata && cliMap.metadata.sourceCount === 4756 && cliMap.metadata.sourcesContentCount === 4756 && mapProof.remoteMapDecoder && mapProof.remoteMapDecoder.status === 'pass'),
      evidence: `sources=${cliMap.metadata ? cliMap.metadata.sourceCount : 'n/a'}, sourcesContent=${cliMap.metadata ? cliMap.metadata.sourcesContentCount : 'n/a'}, decoder=${mapProof.remoteMapDecoder ? mapProof.remoteMapDecoder.status : 'n/a'}`,
      artifact: refs.sourceMap.path,
      hash: refs.sourceMap.hash,
      mapAnchor,
    },
    {
      claim: 'Live UI proof exists as runtime evidence, not only static topology.',
      status: passFail(liveUi.status === 'pass'),
      evidence: `liveUiGate=${liveUi.status || 'n/a'}`,
      artifact: refs.gates.path,
      hash: refs.gates.hash,
      mapAnchor: '',
    },
    {
      claim: 'Vitest completed with a clean process exit.',
      status: passFail(vitest.status === 'pass'),
      evidence: `vitest=${vitest.status || 'n/a'}, exitCode=${vitest.exitCode == null ? 'n/a' : vitest.exitCode}`,
      artifact: refs.vitest.path,
      hash: refs.vitest.hash,
      mapAnchor: '',
    },
    {
      claim: 'Swarm and agent lane is available and proven by the gate.',
      status: passFail((swarmDryRun && swarmDryRun.ok) || skills.swarmCoordinatorExposed || skills.agentExposed),
      evidence: `swarmDryRun=${Boolean(swarmDryRun && swarmDryRun.ok)}, coordinator=${Boolean(skills.swarmCoordinatorExposed)}, agent=${Boolean(skills.agentExposed)}`,
      artifact: refs.native.path,
      hash: refs.native.hash,
      mapAnchor: '',
    },
    {
      claim: 'Artifact discipline is complete.',
      status: passFail(ledger.allArtifactsLogged && ledger.hashesMatch),
      evidence: `logged=${ledger.loggedArtifacts || 0}/${ledger.expectedArtifacts || 0}, hashesMatch=${Boolean(ledger.hashesMatch)}`,
      artifact: refs.hashes.path,
      hash: refs.hashes.hash,
      mapAnchor: '',
    },
    {
      claim: 'Final certification summary is present.',
      status: passFail(evidence.score && evidence.score.total === 100),
      evidence: `score=${evidence.score ? evidence.score.total : 'n/a'}, status=${evidence.score && evidence.score.total === 100 ? 'CERTIFIED_100' : 'PROVISIONAL'}`,
      artifact: refs.summary.path,
      hash: refs.summary.hash,
      mapAnchor: '',
    },
  ];
}

function markdownReport(evidence) {
  const lines = [];
  const score = evidence.score;
  lines.push('# MCP Server Tools 100 Certification Report');
  lines.push('');
  lines.push(`Generated: ${evidence.generatedAt}`);
  lines.push(`Run ID: ${evidence.runId}`);
  lines.push('');
  lines.push(`## Final Score: ${score.total}/100`);
  lines.push('');
  lines.push(score.total === 100
    ? 'Result: MCP Server Tools 100/100 is certified by fresh artifacts.'
    : 'Result: provisional. One or more lanes are missing fresh proof or matching artifacts.');
  lines.push('');
  lines.push('## Atomic Score Matrix');
  lines.push('');
  lines.push('| Lane | Points |');
  lines.push('| --- | ---: |');
  lines.push(`| Tool inventory/schema | ${score.matrix.toolInventorySchema}/10 |`);
  lines.push(`| Auth/RBAC/skill filtering | ${score.matrix.authRbacSkillFiltering}/15 |`);
  lines.push(`| Streamable HTTP/SSE/metrics/admin | ${score.matrix.streamableHttpSseMetricsAdmin}/15 |`);
  lines.push(`| MCP resources/read resources | ${score.matrix.mcpResourcesReadResources}/10 |`);
  lines.push(`| SourceMap/GPS proof | ${score.matrix.sourceMapGpsProof}/15 |`);
  lines.push(`| Forensic audit/reporting | ${score.matrix.forensicAuditReporting}/15 |`);
  lines.push(`| Swarm/agent proof | ${score.matrix.swarmAgentProof}/10 |`);
  lines.push(`| Artifact + Shadow Ledger discipline | ${score.matrix.artifactLedgerDiscipline}/10 |`);
  lines.push('');
  lines.push('## Evidence');
  lines.push('');
  lines.push('SHA-256 source of truth: `artifact_hashes.json` for regular artifacts, and Shadow Ledger for `artifact_hashes.json` itself.');
  lines.push('');
  for (const artifact of evidence.artifacts) {
    lines.push(`- \`${artifact.path}\` - ${artifact.kind}`);
  }
  lines.push('');
  lines.push('## Atomic Findings');
  lines.push('');
  lines.push('| Claim | Status | Evidence | Artifact | SHA-256 | Map Anchor |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const finding of buildFindings(evidence)) {
    lines.push(`| ${mdCell(finding.claim)} | ${mdCell(finding.status)} | ${mdCell(finding.evidence)} | \`${mdCell(finding.artifact)}\` | \`${mdCell(finding.hash)}\` | ${mdCell(finding.mapAnchor)} |`);
  }
  lines.push('');
  lines.push('## Forensic Method');
  lines.push('');
  lines.push('- Every finding is tied to an artifact path and a SHA-256 reference where the artifact is stable at report-generation time.');
  lines.push('- `artifact_hashes.json` remains the source of truth for final artifact hashes; its own final hash is recorded in Shadow Ledger to avoid a self-hash paradox.');
  lines.push('- External reports are historical unless imported into this evidence directory, hashed, and logged.');
  lines.push('');
  lines.push('## Map Anchors');
  lines.push('');
  const anchor = evidence.sourceMapToolProofs
    && evidence.sourceMapToolProofs.remoteMapDecoder
    && evidence.sourceMapToolProofs.remoteMapDecoder.mapAnchor;
  if (anchor) {
    lines.push(`- Generated: ${JSON.stringify(anchor.generated)}`);
    lines.push(`- Original: ${JSON.stringify(anchor.original)}`);
  } else {
    lines.push('- No mappable generated frame was proven in this run.');
  }
  lines.push('');
  lines.push('## Gate Status');
  lines.push('');
  for (const [name, gate] of Object.entries(evidence.gates)) {
    lines.push(`- ${name}: ${gate.status}`);
  }
  lines.push('');
  lines.push('## Remaining Risk');
  lines.push('');
  if (score.total === 100) {
    lines.push('- No pending certification lane reported by this gate.');
  } else {
    const failedGates = Object.entries(evidence.gates || {})
      .filter(([, gate]) => gate && ['fail', 'timeout'].includes(gate.status))
      .map(([name]) => name);
    if (failedGates.length > 0) lines.push(`- Failed gates: ${failedGates.join(', ')}.`);
    lines.push('- Do not claim 100/100 until every lane reaches full points with fresh artifacts.');
    if (score.matrix.streamableHttpSseMetricsAdmin < 15) lines.push('- Streamable HTTP/SSE/metrics/admin proof is incomplete, usually because admin API key/server evidence is missing.');
    if (score.matrix.sourceMapGpsProof < 15) lines.push('- SourceMap GPS proof is incomplete; inspect `source_map_tool_proofs.json`.');
    if (score.matrix.artifactLedgerDiscipline < 10) lines.push('- Artifact ledger proof is incomplete; inspect Shadow Ledger entries for this run ID.');
  }
  lines.push('');
  return lines.join('\n');
}

function htmlReport(markdown) {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head><meta charset="utf-8"><title>MCP Tools Certification</title>',
    '<style>body{font-family:Segoe UI,Arial,sans-serif;margin:32px;line-height:1.5;background:#101418;color:#eef2f6}pre{white-space:pre-wrap;background:#151c24;padding:20px;border:1px solid #2a3441;border-radius:8px}code{color:#9fd1ff}</style>',
    '</head>',
    '<body><pre>',
    escaped,
    '</pre></body></html>',
  ].join('');
}

function verifyLedgerArtifacts(currentArtifacts) {
  if (!fs.existsSync(ledgerPath)) {
    return { allArtifactsLogged: false, hashesMatch: false, loggedArtifacts: 0, ledgerPath: relative(ledgerPath) };
  }
  const ledger = fs.readFileSync(ledgerPath, 'utf8');
  const logged = currentArtifacts.filter(artifact =>
    ledger.includes(runId) && ledger.includes(artifact.path) && ledger.includes(artifact.sha256)
  );
  return {
    allArtifactsLogged: logged.length === currentArtifacts.length,
    hashesMatch: logged.length === currentArtifacts.length,
    loggedArtifacts: logged.length,
    expectedArtifacts: currentArtifacts.length,
    ledgerPath: relative(ledgerPath),
  };
}

function refreshArtifacts() {
  for (const artifact of [...artifacts]) {
    registerArtifact(path.join(root, artifact.path), artifact.kind);
  }
  return artifacts;
}

function logArtifacts(eventStatus) {
  for (const artifact of artifacts) {
    appendLedger({
      status: 'SUCCESS',
      eventStatus,
      artifact: artifact.path,
      kind: artifact.kind,
      bytes: artifact.bytes,
      sha256: artifact.sha256,
    });
  }
}

function writeArtifactHashes() {
  refreshArtifacts();
  return writeJson('artifact_hashes.json', {
    generatedAt: now(),
    runId,
    note: 'Hashes for current artifacts except artifact_hashes.json itself. The self-hash is recorded in Shadow Ledger.',
    artifacts: artifacts
      .filter(artifact => !artifact.path.endsWith('/artifact_hashes.json'))
      .map(artifact => ({ ...artifact })),
  }, 'artifact-hashes');
}

async function main() {
  writeJson('environment.json', envSummary(), 'environment');

  const gates = {
    testMcpIntegration: { status: 'not_run' },
    cliMap: { status: 'not_run' },
    toolSourceAlignment: { status: 'not_run' },
    agentSwarmAlignment: { status: 'not_run' },
    nativeMcp: { status: 'not_run' },
    globalProductionGate: { status: 'not_run' },
    sovereign90Sweep: { status: 'not_run' },
    liveUi: { status: 'not_run' },
    vitest: { status: full ? 'not_run' : 'skipped' },
  };

  if (!skipGates) {
    const testMcp = runCommand('test_mcp_integration', 'node', ['test_mcp_integration.js'], { timeoutMs: 90000 });
    gates.testMcpIntegration = { status: commandStatus(testMcp), parsed: null, exitCode: testMcp.exitCode };

    const cliMap = runCommand('cli_map_verify', 'node', ['scripts/verify_cli_map.js', '--no-ledger'], { timeoutMs: 120000 });
    gates.cliMap = { status: commandStatus(cliMap), parsed: commandJson(cliMap), exitCode: cliMap.exitCode };

    const toolSource = runCommand('tool_source_alignment', 'node', ['scripts/verify_tool_source_alignment.js', '--no-ledger'], { timeoutMs: 120000 });
    gates.toolSourceAlignment = { status: commandStatus(toolSource), parsed: commandJson(toolSource), exitCode: toolSource.exitCode };

    const agentSwarm = runCommand('agent_swarm_alignment', 'node', ['scripts/verify_agent_swarm_alignment.js', '--no-ledger'], { timeoutMs: 150000 });
    gates.agentSwarmAlignment = { status: commandStatus(agentSwarm), parsed: commandJson(agentSwarm), exitCode: agentSwarm.exitCode };

    const native = runCommand('native_mcp_verify', 'npm', ['run', 'native-mcp:verify'], { timeoutMs: 120000 });
    gates.nativeMcp = { status: commandStatus(native), parsed: commandJson(native), exitCode: native.exitCode };

    const global = runCommand('global_production_gate', 'npm', ['run', 'global:production-gate'], { timeoutMs: 180000 });
    gates.globalProductionGate = { status: commandStatus(global), parsed: commandJson(global), exitCode: global.exitCode };

    const sovereign = runCommand('sovereign_90_sweep', 'npm', ['run', 'sovereign:90-sweep'], { timeoutMs: 240000 });
    gates.sovereign90Sweep = { status: commandStatus(sovereign), parsed: commandJson(sovereign), exitCode: sovereign.exitCode };

    const liveUi = runCommand('live_ui_verify', 'npm', ['run', 'live-ui:verify'], { timeoutMs: 90000 });
    gates.liveUi = { status: commandStatus(liveUi), parsed: commandJson(liveUi), exitCode: liveUi.exitCode };

    if (full) {
      const vitest = runCommand('vitest_after', 'npx', ['vitest', 'run'], { timeoutMs: 240000 });
      gates.vitest = { status: commandStatus(vitest), parsed: null, exitCode: vitest.exitCode };
    }
  }

  const mcpResources = await collectMcpResources();
  writeJson('mcp_resources.json', mcpResources, 'mcp-resources');

  const streamableHttp = gates.nativeMcp.parsed
    && gates.nativeMcp.parsed.http
    && gates.nativeMcp.parsed.http.authenticated
    ? gates.nativeMcp.parsed.http.authenticated.streamableHttp
    : { ok: false, reason: 'native MCP parsed output missing streamable HTTP proof' };
  writeJson('streamable_http_transcript.json', {
    generatedAt: now(),
    source: 'npm run native-mcp:verify',
    transcript: streamableHttp,
  }, 'transport-proof');

  writeJson('native_mcp_evidence.json', {
    generatedAt: now(),
    authProof: gates.nativeMcp.parsed && gates.nativeMcp.parsed.http ? gates.nativeMcp.parsed.http.authenticated : null,
    deniedAccessProof: gates.nativeMcp.parsed && gates.nativeMcp.parsed.http ? {
      unauthMetricsDenied: gates.nativeMcp.parsed.http.unauthMetricsDenied,
      unauthMcpDenied: gates.nativeMcp.parsed.http.unauthMcpDenied,
    } : null,
    toolFilterProof: gates.nativeMcp.parsed ? gates.nativeMcp.parsed.toolFiltering : null,
  }, 'native-mcp-proof');

  const sourceMapToolProofs = await collectSourceMapToolProofs(gates.cliMap.parsed);
  writeJson('source_map_tool_proofs.json', sourceMapToolProofs, 'source-map-proof');

  const toolSourceAlignment = gates.toolSourceAlignment.parsed || {
    status: gates.toolSourceAlignment.status,
    reason: 'tool_source_alignment command did not produce parseable JSON',
  };
  writeJson('tool_source_alignment.json', toolSourceAlignment, 'tool-source-alignment');

  const agentSwarmAlignment = gates.agentSwarmAlignment.parsed || {
    status: gates.agentSwarmAlignment.status,
    reason: 'agent_swarm_alignment command did not produce parseable JSON',
  };
  writeJson('agent_swarm_alignment.json', agentSwarmAlignment, 'agent-swarm-alignment');

  const gateExtracts = {
    generatedAt: now(),
    gates,
    productionGate: gates.globalProductionGate.parsed,
    sovereign90Sweep: gates.sovereign90Sweep.parsed,
    liveUi: gates.liveUi.parsed,
  };
  writeJson('gate_extracts.json', gateExtracts, 'gate-proof');

  const evidence = {
    generatedAt: now(),
    runId,
    evidenceDir: relative(evidenceDir),
    gates,
    mcpResources,
    sourceMapToolProofs,
    toolSourceAlignment,
    agentSwarmAlignment,
    artifacts,
    reportArtifacts: {},
    ledgerProof: { allArtifactsLogged: false, hashesMatch: false },
  };

  evidence.reportArtifacts = {
    summary: writeJson('summary.json', { status: 'PREPARING', runId, evidenceDir: relative(evidenceDir) }, 'summary'),
    scores: writeJson('scores.json', { status: 'PREPARING' }, 'scores'),
    hashes: writeArtifactHashes(),
  };
  evidence.score = scoreEvidence(evidence);
  evidence.reportArtifacts.markdown = writeText('forensic_report.md', markdownReport({ ...evidence, artifacts }), 'forensic-report-md');
  evidence.reportArtifacts.html = writeText('forensic_report.html', htmlReport(markdownReport({ ...evidence, artifacts })), 'forensic-report-html');
  evidence.reportArtifacts.hashes = writeArtifactHashes();

  refreshArtifacts();
  logArtifacts('ARTIFACT_RECORDED');

  evidence.ledgerProof = verifyLedgerArtifacts(artifacts);
  evidence.score = scoreEvidence(evidence);

  const finalSummary = {
    generatedAt: now(),
    runId,
    status: evidence.score.total === 100 ? 'CERTIFIED_100' : 'PROVISIONAL',
    score: evidence.score.total,
    matrix: evidence.score.matrix,
    evidenceDir: relative(evidenceDir),
    ledgerProof: evidence.ledgerProof,
    artifactCount: artifacts.length,
    strict,
  };
  evidence.reportArtifacts.summary = writeJson('summary.json', finalSummary, 'summary');
  evidence.reportArtifacts.scores = writeJson('scores.json', evidence.score, 'scores');
  evidence.reportArtifacts.markdown = writeText('forensic_report.md', markdownReport({ ...evidence, artifacts }), 'forensic-report-md');
  evidence.reportArtifacts.html = writeText('forensic_report.html', htmlReport(markdownReport({ ...evidence, artifacts })), 'forensic-report-html');
  evidence.reportArtifacts.hashes = writeArtifactHashes();

  refreshArtifacts();
  logArtifacts('FINAL_ARTIFACT_RECORDED');
  const finalLedgerProof = verifyLedgerArtifacts(artifacts);

  appendLedger({
    status: 'SUCCESS',
    certificationStatus: finalSummary.status,
    score: finalSummary.score,
    evidenceDir: finalSummary.evidenceDir,
    artifactCount: artifacts.length,
    ledgerProof: finalLedgerProof,
  });

  process.stdout.write(JSON.stringify({
    status: finalSummary.status,
    score: finalSummary.score,
    evidenceDir: finalSummary.evidenceDir,
    report: relative(path.join(evidenceDir, 'forensic_report.md')),
    artifacts: artifacts.length,
    ledgerProof: finalLedgerProof,
  }, null, 2) + '\n');

  if (strict && finalSummary.score < 100) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  writeJson('fatal_error.json', {
    generatedAt: now(),
    runId,
    status: 'ERROR',
    message: redact(error.message),
    stack: redact(error.stack || ''),
  }, 'fatal-error');
  appendLedger({
    status: 'ERROR',
    error: redact(error.message),
    evidenceDir: relative(evidenceDir),
  });
  console.error(JSON.stringify({ status: 'ERROR', message: redact(error.message), evidenceDir: relative(evidenceDir) }, null, 2));
  process.exitCode = 1;
});
