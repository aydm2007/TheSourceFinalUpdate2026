#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

// Load environment variables from .env file
require('dotenv').config();

const root = path.resolve(__dirname, '..');
const sessionId = process.env.AETHER_MCP_VERIFY_SESSION || 'native_mcp_verify';
const baseUrl = process.env.AETHER_MCP_BASE_URL || 'http://127.0.0.1:3847';
const projectId = process.env.AETHER_MCP_PROJECT || 'thesource';
const timeoutMs = Number(process.env.AETHER_MCP_VERIFY_TIMEOUT_MS || 3000);

function now() {
  return new Date().toISOString();
}

function appendLedger(payload) {
  const ledgerDir = path.join(root, '.nexus', 'var', 'telemetry');
  const ledgerPath = path.join(ledgerDir, 'shadow_ledger.jsonl');
  fs.mkdirSync(ledgerDir, { recursive: true });
  const record = {
    timestamp: now(),
    sessionId,
    type: 'native_mcp_verification',
    action: 'verify_native_mcp',
    status: payload.status || 'SUCCESS',
    ...payload,
  };
  fs.appendFileSync(ledgerPath, JSON.stringify(record) + '\n');
}

function pass(extra = {}) {
  return { ok: true, ...extra };
}

function fail(reason, extra = {}) {
  return { ok: false, reason, ...extra };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function getApiKey() {
  const candidates = ['AETHER_MCP_API_KEY', 'NEXUS_API_KEY', 'MCP_API_KEY', 'API_KEY'];
  const source = candidates.find(name => process.env[name]);
  if (!source) return { value: null, source: null };
  return { value: process.env[source], source };
}

function makeHmac(apiKey, routePath) {
  return crypto.createHmac('sha256', apiKey).update(routePath).digest('hex');
}

function httpRequest(method, endpointPath, headers = {}, options = {}) {
  return new Promise(resolve => {
    let url;
    try {
      url = new URL(endpointPath, baseUrl);
    } catch (error) {
      resolve(fail(`invalid url: ${error.message}`));
      return;
    }

    const client = url.protocol === 'https:' ? https : http;
    const request = client.request(url, {
      method,
      headers,
      timeout: timeoutMs,
    }, response => {
      const chunks = [];
      let total = 0;

      if (options.resolveOnHeaders) {
        resolve({
          ok: true,
          statusCode: response.statusCode,
          headers: response.headers,
          bodyPreview: '',
        });
        response.destroy();
        return;
      }

      response.on('data', chunk => {
        total += chunk.length;
        if (total <= 65536) chunks.push(chunk);
      });
      response.on('end', () => {
        resolve({
          ok: true,
          statusCode: response.statusCode,
          headers: response.headers,
          bodyPreview: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error(`timeout after ${timeoutMs}ms`));
    });
    request.on('error', error => {
      resolve(fail(error.message));
    });
    request.end();
  });
}

function sessionPathFor(id) {
  return path.join(root, '.nexus', 'sessions', `${id}_skill.json`);
}

function withSkill(sharedMcp, skillName, callback) {
  const filePath = sessionPathFor(sessionId);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify({ activeSkill: skillName }, null, 2));
  sharedMcp.invalidateSkillCache(sessionId);
  try {
    return callback();
  } finally {
    try {
      fs.unlinkSync(filePath);
    } catch (_) {
      // best effort cleanup
    }
    sharedMcp.invalidateSkillCache(sessionId);
  }
}

function getFacadeActions(tools, facadeName) {
  const tool = tools.find(item => item.name === facadeName);
  return tool && tool.inputSchema && tool.inputSchema.properties && tool.inputSchema.properties.action
    ? tool.inputSchema.properties.action.enum || []
    : [];
}

function loadBridgeEvidence() {
  const sharedMcp = require('../core/mcp/shared_mcp_core.js');
  const bridgeConfig = readJson(path.join(root, 'bridge.json'));
  const bridge = {
    KAIROS_TOOLS: (bridgeConfig.allowed_tools || []).map(name => ({
      type: 'function',
      function: {
        name,
        description: `Declared bridge tool: ${name}`,
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    })),
  };
  const allTools = sharedMcp.loadAllBridgeTools(bridge, bridgeConfig, true, sessionId);
  return { sharedMcp, bridgeConfig, allTools };
}

function checkToolFiltering(sharedMcp, bridgeConfig, allTools) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'native-mcp-noskill-'));
  let bootstrapTools = [];
  try {
    bootstrapTools = sharedMcp.getFilteredToolsForClient(allTools, tempRoot, 'noskill').map(tool => tool.name).sort();
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  const expectedBootstrap = [
    'nexus_AskUserQuestion',
    'nexus_CognitiveRouter',
    'nexus_LoadSkill',
    'nexus_SwarmHandoff',
  ];

  const mcpDeveloper = withSkill(sharedMcp, 'mcp-developer', () =>
    sharedMcp.getFilteredToolsForClient(allTools, root, sessionId)
  );
  const swarm = withSkill(sharedMcp, 'swarm-gps-coordinator', () =>
    sharedMcp.getFilteredToolsForClient(allTools, root, sessionId)
  );
  const cloudMentor = withSkill(sharedMcp, 'cloud-opus-mentor', () =>
    sharedMcp.getFilteredToolsForClient(allTools, root, sessionId)
  );
  const security = withSkill(sharedMcp, 'security-audit', () =>
    sharedMcp.getFilteredToolsForClient(allTools, root, sessionId)
  );

  const swarmActions = getFacadeActions(swarm, 'nexus_SwarmManager');
  const developerFileActions = getFacadeActions(mcpDeveloper, 'nexus_FileSystemManager');
  const securityFileActions = getFacadeActions(security, 'nexus_FileSystemManager');

  const authPass = withSkill(sharedMcp, 'mcp-developer', () =>
    sharedMcp.authorizeToolCall('FileRead', bridgeConfig, () => {}, sessionId)
  );
  const authDeny = withSkill(sharedMcp, 'security-audit', () =>
    sharedMcp.authorizeToolCall('FileWrite', bridgeConfig, () => {}, sessionId)
  );

  return {
    bootstrap: {
      expected: expectedBootstrap,
      actual: bootstrapTools,
      ok: expectedBootstrap.every(name => bootstrapTools.includes(name)) && bootstrapTools.length === expectedBootstrap.length,
    },
    skills: {
      mcpDeveloperToolCount: mcpDeveloper.length,
      cloudOpusMentorToolCount: cloudMentor.length,
      swarmToolCount: swarm.length,
      swarmManagerActions: swarmActions,
      swarmCoordinatorExposed: swarmActions.includes('ParallelSwarmCoordinator'),
      agentExposed: swarmActions.includes('Agent'),
      mcpDeveloperFileActions: developerFileActions,
      securityFileActions,
    },
    authorization: {
      fileReadUnderMcpDeveloper: authPass.allowed === true,
      fileWriteDeniedUnderSecurityAudit: authDeny.allowed === false,
      denialReasonClass: authDeny.allowed === false ? 'SKILL_STRICT_DENIAL' : 'NOT_DENIED',
    },
  };
}

function checkLevel5Routing() {
  const { SovereignCognitiveRouter } = require('../core/bridge/hybrid_router.js');
  const router = new SovereignCognitiveRouter();

  const originalLog = console.error;
  console.error = () => {};
  try {
    const localRoute = router.routeTask('patch auth database migration with RBAC validation');
    const cloudRoute = router.routeTask('theoretical architectural synthesis for token policy');
    const scrubbed = router.scrubPayload('contact admin@example.com and sig-apex-123 for details');
    return {
      localSensitiveRoute: localRoute.target,
      localSensitiveReason: localRoute.reason,
      cloudAbstractRoute: cloudRoute.target,
      cloudAbstractReason: cloudRoute.reason,
      redactionApplied: scrubbed.includes('[CLASSIFIED_SOVEREIGN_MASK]') && !scrubbed.includes('admin@example.com'),
      cloudOpusRole: 'planner_mentor_only',
      ok: localRoute.target === 'LOCAL_KAIROS_MCP'
        && cloudRoute.target === 'ANONYMOUS_CLOUD_OPUS'
        && scrubbed.includes('[CLASSIFIED_SOVEREIGN_MASK]'),
    };
  } finally {
    console.error = originalLog;
  }
}

async function checkSwarmDryRun() {
  const { ParallelSwarmCoordinator } = require('../core/bridge/handlers/swarm_handlers.js');
  const ledgerEvents = [];
  const resultText = await ParallelSwarmCoordinator({
    dry_run: true,
    wave_size: 6,
    agents: [
      { name: 'Security', description: 'Read-only security sweep', subagent_type: 'security-audit' },
      { name: 'Bridge', description: 'Read-only MCP bridge sweep', subagent_type: 'mcp-developer' },
      { name: 'CloudOps', description: 'Read-only CloudOps sweep', subagent_type: 'cloudops-critic' },
    ],
  }, {
    __dirname: root,
    FEATURE_FLAGS: { SWARM_MODE: true },
    logShadow: event => ledgerEvents.push(event),
  });

  let parsed;
  try {
    parsed = JSON.parse(resultText);
  } catch (error) {
    return fail(`swarm dry-run returned non-json: ${error.message}`, { rawPreview: resultText.slice(0, 160) });
  }

  return {
    ok: parsed.status === 'planned' && parsed.total_agents === 3 && parsed.wave_size === 6,
    plan: parsed,
    ledgerEventTypes: ledgerEvents.map(event => event.type),
  };
}

async function checkHttpEndpoints() {
  const key = getApiKey();
  const unauthMetrics = await httpRequest('GET', '/metrics');
  const unauthMcp = await httpRequest('GET', '/mcp', {}, { resolveOnHeaders: true });
  const result = {
    baseUrl,
    apiKeySource: key.source || 'not_provided',
    unauthMetricsDenied: unauthMetrics.ok && [401, 403].includes(unauthMetrics.statusCode),
    unauthMcpDenied: unauthMcp.ok && [401, 403].includes(unauthMcp.statusCode),
    serverReachable: Boolean(unauthMetrics.ok || unauthMcp.ok),
    authenticated: {
      metrics: { ok: false, skipped: true, reason: 'No API key provided through environment.' },
      mcpSse: { ok: false, skipped: true, reason: 'No API key provided through environment.' },
      streamableHttp: { ok: false, skipped: true, reason: 'No API key provided through environment.' },
      allTools: { ok: false, skipped: true, reason: 'No API key provided through environment.' },
      toolSmoke: { ok: false, skipped: true, reason: 'No API key provided through environment.' },
    },
  };

  if (!key.value) return result;

  const authHeaders = {
    Authorization: `Bearer ${key.value}`,
    'x-project-id': projectId,
  };
  const strictHeaders = {
    ...authHeaders,
    'x-mcp-hmac': makeHmac(key.value, '/mcp'),
  };

  const metrics = await httpRequest('GET', '/metrics', authHeaders);
  result.authenticated.metrics = {
    ok: metrics.ok && metrics.statusCode === 200 && /#\s*HELP|mcp_/i.test(metrics.bodyPreview),
    statusCode: metrics.statusCode || null,
  };

  const mcp = await httpRequest('GET', '/mcp', strictHeaders, { resolveOnHeaders: true });
  result.authenticated.mcpSse = {
    ok: mcp.ok && mcp.statusCode === 200 && String(mcp.headers && mcp.headers['content-type'] || '').includes('event-stream'),
    statusCode: mcp.statusCode || null,
    contentType: mcp.headers && mcp.headers['content-type'] || null,
  };

  result.authenticated.streamableHttp = await checkStreamableHttp(key.value);

  const tools = await httpRequest('GET', '/admin/api/all-tools', authHeaders);
  let toolCount = null;
  if (tools.ok && tools.statusCode === 200) {
    try {
      const parsed = JSON.parse(tools.bodyPreview);
      toolCount = Array.isArray(parsed) ? parsed.length : null;
    } catch (_) {
      toolCount = null;
    }
  }
  result.authenticated.allTools = {
    ok: tools.ok && tools.statusCode === 200 && Number.isInteger(toolCount),
    statusCode: tools.statusCode || null,
    toolCount,
  };

  result.authenticated.toolSmoke = {
    ok: result.authenticated.streamableHttp.ok && result.authenticated.streamableHttp.readOnlyToolCallOk,
    via: 'streamable-http',
    readOnlyToolCallOk: result.authenticated.streamableHttp.readOnlyToolCallOk === true,
  };

  return result;
}

async function checkStreamableHttp(apiKey) {
  try {
    const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
    const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
    const client = new Client({ name: 'native-mcp-verifier', version: '1.0.0' });
    const streamPath = '/mcp/stream';
    const transport = new StreamableHTTPClientTransport(new URL(streamPath, baseUrl), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'x-project-id': projectId,
          'x-mcp-hmac': makeHmac(apiKey, streamPath),
        },
      },
    });

    await client.connect(transport);
    const listed = await client.listTools();
    const tools = Array.isArray(listed.tools) ? listed.tools : [];
    const fileManager = tools.find(tool => tool.name === 'nexus_FileSystemManager');
    let readOnlyToolCallOk = false;
    if (fileManager) {
      const result = await client.callTool({
        name: 'nexus_FileSystemManager',
        arguments: {
          action: 'FileRead',
          payload: { file_path: 'AGENTS.md', offset: 0, limit: 80 },
        },
      });
      readOnlyToolCallOk = Boolean(result && Array.isArray(result.content));
    }
    await client.close();
    return {
      ok: tools.length > 0,
      toolCount: tools.length,
      fileManagerExposed: Boolean(fileManager),
      readOnlyToolCallOk,
      transport: 'streamable-http',
    };
  } catch (error) {
    return {
      ok: false,
      errorClass: error && error.constructor ? error.constructor.name : 'Error',
      reason: error && error.message ? error.message.replace(/Bearer\s+[^\s]+/g, 'Bearer [REDACTED]') : 'unknown streamable http error',
      transport: 'streamable-http',
    };
  }
}

function computeScore(evidence) {
  let score = 0;
  if (evidence.http.unauthMetricsDenied || evidence.http.unauthMcpDenied) score += 10;
  if (evidence.http.authenticated.metrics.ok) score += 10;
  if (evidence.http.authenticated.mcpSse.ok) score += 10;
  if (evidence.http.authenticated.streamableHttp.ok) score += 10;
  if (evidence.http.authenticated.allTools.ok) score += 10;
  if (evidence.http.authenticated.toolSmoke.ok) score += 10;
  if (evidence.toolFiltering.bootstrap.ok) score += 15;
  if (evidence.toolFiltering.skills.swarmCoordinatorExposed && evidence.toolFiltering.skills.agentExposed) score += 15;
  if (evidence.toolFiltering.authorization.fileReadUnderMcpDeveloper && evidence.toolFiltering.authorization.fileWriteDeniedUnderSecurityAudit) score += 10;
  if (evidence.level5.ok) score += 10;
  if (evidence.swarmDryRun.ok) score += 10;
  return Math.min(score, 100);
}

async function main() {
  const bridgeEvidence = loadBridgeEvidence();
  const [httpEvidence, swarmDryRun] = await Promise.all([
    checkHttpEndpoints(),
    checkSwarmDryRun(),
  ]);
  const toolFiltering = checkToolFiltering(
    bridgeEvidence.sharedMcp,
    bridgeEvidence.bridgeConfig,
    bridgeEvidence.allTools
  );
  const level5 = checkLevel5Routing();

  const evidence = {
    generatedAt: now(),
    workspace: root,
    nativeMcpLauncher: path.join(root, 'launch_native_mcp.cmd'),
    bridge: {
      enforcementMode: bridgeEvidence.bridgeConfig.enforcementMode,
      remoteMcpEnabled: bridgeEvidence.bridgeConfig.remote_mcp_enabled === true,
      declaredAllowedTools: Array.isArray(bridgeEvidence.bridgeConfig.allowed_tools)
        ? bridgeEvidence.bridgeConfig.allowed_tools.length
        : 0,
      exposedMcpTools: bridgeEvidence.allTools.length,
    },
    http: httpEvidence,
    toolFiltering,
    level5,
    swarmDryRun,
  };

  evidence.score = computeScore(evidence);
  evidence.status = evidence.score >= 90 ? 'PASS_90_GATE' : 'PARTIAL_PROOF';

  appendLedger({
    status: evidence.status,
    score: evidence.score,
    httpServerReachable: evidence.http.serverReachable,
    level5Ok: evidence.level5.ok,
    swarmDryRunOk: evidence.swarmDryRun.ok,
    bootstrapOk: evidence.toolFiltering.bootstrap.ok,
  });

  process.stdout.write(JSON.stringify(evidence, null, 2) + '\n');

  if (process.argv.includes('--strict') && evidence.score < 90) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  appendLedger({ status: 'FAIL', error: error.message });
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
