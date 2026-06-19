#!/usr/bin/env node
/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  🔌 Nexus Bridge MCP Server V1.0                                  │
 * │  Exposes all nexus_bridge.js tools as MCP tools for IDE agents    │
 * │  Protocol: stdio (compatible with Claude Code, Antigravity, etc.) │
 * │                                                                    │
 * │  Every tool call passes through BridgeEnforcer and logs to         │
 * │  shadow_ledger.jsonl — ensuring 100% bridge compliance.           │
 * └────────────────────────────────────────────────────────────────────┘
 */
// Redirect all console.log output to console.error (stderr) to prevent stdio JSON-RPC corruption
global.Decimal = require('decimal.js');
console.log = (...args) => {
  console.error(...args);
};

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const { getTelemetryPaths } = require('./core/utils/telemetry_paths.js');
const argValidator = require('./core/middleware/tool_arg_validator.js');

// ─── Load Bridge ───────────────────────────────────────────────────
const BRIDGE_ROOT = __dirname;
const bridgeJsonPath = path.join(BRIDGE_ROOT, 'bridge.json');
const shadowLedgerPath = getTelemetryPaths().shadowLedgerPath;

let bridgeConfig = { allowed_tools: [], total_tools: 0, bridgeVersion: '0.0.0', enforcementMode: 'STRICT' };
try {
  bridgeConfig = JSON.parse(fs.readFileSync(bridgeJsonPath, 'utf-8'));
} catch (e) {
  console.error(`[MCP-Bridge] CRITICAL: Cannot load bridge.json — ${e.message}`);
}

// ─── Swarm Telepathy Bus (Global) ───────────────────────────────────
let telepathyBus = null;
try {
  const { TelepathyBus } = require('./src/core/swarm/TelepathyBus.js');
  telepathyBus = new TelepathyBus();
  global.telepathyBus = telepathyBus; // Attach to global for nexus_bridge to use

  // Subscribe to core Swarm Events
  telepathyBus.subscribe('FINANCE_EVENT', (msg) => {
    logToShadowLedger({ type: 'SWARM_EVENT', channel: 'FINANCE_EVENT', payload: msg });
  });

  telepathyBus.subscribe('AGRI_UPDATE', (msg) => {
    logToShadowLedger({ type: 'SWARM_EVENT', channel: 'AGRI_UPDATE', payload: msg });
  });
} catch (e) {
  console.error(`[MCP-Bridge] Failed to init TelepathyBus — ${e.message}`);
}

// ─── Shadow Ledger Logging (Pino Async Batching) ───────────────────
const pino = require('pino');
const ledgerDir = path.dirname(shadowLedgerPath);
if (!fs.existsSync(ledgerDir)) fs.mkdirSync(ledgerDir, { recursive: true });
const shadowLogger = pino({ timestamp: false, messageKey: 'msg' }, pino.destination({ dest: shadowLedgerPath, sync: false, minLength: 4096 }));

function logToShadowLedger(entry) {
  const record = {
    timestamp: new Date().toISOString(),
    source: 'MCP_BRIDGE_SERVER',
    bridgeVersion: bridgeConfig.bridgeVersion || '3.0.0',
    type: entry.type || 'mcp_bridge_event',
    action: entry.action || entry.tool || entry.type || 'UNKNOWN_ACTION',
    status: entry.status || (entry.allowed === false ? 'REJECTED' : 'SUCCESS'),
    ...entry
  };
  shadowLogger.info(record);
}

// ─── Shared MCP Core ───────────────────────────────────────────────
const sharedMcp = require('./core/mcp/shared_mcp_core.js');

// ─── Bridge Authorization ──────────────────────────────────────────
function authorizeToolCall(toolName) {
  return sharedMcp.authorizeToolCall(toolName, bridgeConfig, (logEntry) => {
    logToShadowLedger({ type: 'mcp_bridge_access', ...logEntry });
  });
}

// ─── Lazy-load nexus_bridge ─────────────────────────────────────────────
let bridgeModule = null;
function getBridge() {
  if (!bridgeModule) {
    try {
      bridgeModule = require('./nexus_bridge.js');
    } catch (e) {
      console.error(`[MCP-Bridge] Failed to load nexus_bridge.js: ${e.message}`);
    }
  }
  return bridgeModule;
}

function getExecuteTool() {
  const bridge = getBridge();
  if (bridge && typeof bridge.executeTool === 'function') {
    return bridge.executeTool;
  }
  return async (name, args) => {
    throw new Error(`executeTool function is not exported by nexus_bridge.js`);
  };
}


// ─── MCP Tool Definitions (Dynamic) ────────────────────────────────
let MCP_TOOLS = [];

function loadAllBridgeTools() {
  const bridge = getBridge();
  MCP_TOOLS = sharedMcp.loadAllBridgeTools(bridge, bridgeConfig, false);
}

// Load tools on startup (Moved to async main for Zero-Trust key injection)
// loadAllBridgeTools();

// ─── Create MCP Server ─────────────────────────────────────────────
const server = new Server(
  {
    name: 'nexus-bridge',
    version: bridgeConfig.bridgeVersion || '3.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── List Tools Handler ─────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const filteredTools = sharedMcp.getFilteredToolsForClient(MCP_TOOLS, BRIDGE_ROOT);
  logToShadowLedger({ type: 'mcp_list_tools', toolCount: filteredTools.length });
  return {
    tools: filteredTools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  };
});

// ─── Call Tool Handler ──────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`[MCP-Bridge] Handling tool call: ${request.params.name}`);
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  // Find the MCP tool definition
  const mcpTool = MCP_TOOLS.find(t => t.name === name);
  if (!mcpTool) {
    logToShadowLedger({
      type: 'mcp_tool_not_found',
      tool: name,
      status: 'REJECTED'
    });
    return {
      content: [{ type: 'text', text: `[MCP-Bridge] Unknown tool: ${name}` }],
      isError: true,
    };
  }

  // Support for Facade tools
  let bridgeToolName;
  let toolArgs = args || {};

  if (mcpTool.isFacade) {
    bridgeToolName = toolArgs.action;
    if (!bridgeToolName || !mcpTool.facadeTools.includes(bridgeToolName)) {
      return {
        content: [{ type: 'text', text: `[MCP-Bridge] Invalid action. Allowed: ${mcpTool.facadeTools.join(', ')}` }],
        isError: true,
      };
    }
    toolArgs = toolArgs.payload || {};
  } else {
    bridgeToolName = mcpTool.bridgeTool;
  }

  // Authorize through BridgeEnforcer
  const authResult = authorizeToolCall(bridgeToolName);
  if (!authResult.allowed) {
    return {
      content: [{ type: 'text', text: `[MCP-Bridge] DENIED: ${authResult.reason}` }],
      isError: true,
    };
  }

  // Special handling for SecurityScan (wraps Grep with security patterns)
  if (bridgeToolName === 'SecurityScan') {
    toolArgs = {
      pattern: 'sk-[a-zA-Z0-9]{10,}|password\\s*=\\s*["\'][^\'"]+["\']|SECRET_KEY|PRIVATE_KEY',
      path: toolArgs.path || '.',
      glob: '*.{js,ts,py,env,json}'
    };
  }

  const { valid, args: correctedArgs, corrections, errors, guidance } = argValidator.validateAndCorrect(bridgeToolName, toolArgs);
  if (!valid) {
    logToShadowLedger({
      type: 'mcp_tool_validation_error',
      tool: bridgeToolName,
      mcpName: name,
      status: 'REJECTED',
      errors
    });
    return {
      content: [{ type: 'text', text: guidance }],
      isError: true,
    };
  }
  toolArgs = correctedArgs;

  if (corrections.length > 0) {
    logToShadowLedger({
      type: 'mcp_tool_auto_correction',
      tool: bridgeToolName,
      mcpName: name,
      status: 'SUCCESS',
      corrections
    });
  }

  // Execute through the bridge
  try {
    const executeTool = getExecuteTool();
    const result = await executeTool(bridgeToolName, toolArgs, {
      projectPath: BRIDGE_ROOT,
      __dirname: BRIDGE_ROOT
    });
    const duration = Date.now() - startTime;

    logToShadowLedger({
      type: 'mcp_tool_execution',
      tool: bridgeToolName,
      mcpName: name,
      status: 'SUCCESS',
      durationMs: duration
    });

    const resultText = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    return {
      content: [{ type: 'text', text: resultText }],
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logToShadowLedger({
      type: 'mcp_tool_execution',
      tool: bridgeToolName,
      mcpName: name,
      status: 'FAILED',
      error: error.message,
      durationMs: duration
    });

    return {
      content: [{ type: 'text', text: `[MCP-Bridge] Error executing ${bridgeToolName}: ${error.message}` }],
      isError: true,
    };
  }
});

// ─── Start Server ───────────────────────────────────────────────────
async function main() {
  process.on('uncaughtException', (err) => fs.appendFileSync('crash.log', String(err.stack) + '\n'));
  process.on('unhandledRejection', (err) => fs.appendFileSync('crash.log', String(err) + '\n'));
  process.on('exit', (code) => console.error(`[PROCESS-EXIT] Exiting with code: ${code}`));
  process.on('uncaughtExceptionMonitor', (err) => console.error(`[UNCAUGHT-MONITOR] ${err.stack}`));
  try {
    const keytar = require('keytar');
    const alphaKey = await keytar.getPassword('SovereignNexus', 'AETHER_RELAY_KEY_ALPHA');
    if (alphaKey) process.env.AETHER_RELAY_KEY_ALPHA = alphaKey;
    const betaKey = await keytar.getPassword('SovereignNexus', 'AETHER_RELAY_KEY_BETA');
    if (betaKey) process.env.AETHER_RELAY_KEY_BETA = betaKey;
    console.error('[Security] Zero-Trust: Sovereign keys successfully injected from OS Keychain.');
  } catch (err) {
    console.error('[Security] Zero-Trust: OS Keychain unavailable, falling back to secure process env.');
  }

  // We prevent this by adding a keepalive interval to prevent event loop GC
  // and suppressing unhandled rejections that could crash the bridge
  process.stdin.on('data', chunk => console.error(`[STDIN-DEBUG] Raw chunk received: ${chunk.length} bytes`));

  // Keepalive: prevent Node.js event loop from being drained (every 25s)
  const _keepalive = setInterval(() => { /* sovereign stdio keepalive */ }, 25000);

  // Graceful shutdown handlers
  process.on('SIGTERM', () => {
    console.error('[MCP-Bridge] SIGTERM received — shutting down gracefully.');
    clearInterval(_keepalive);
    process.exit(0);
  });
  process.on('SIGINT', () => {
    console.error('[MCP-Bridge] SIGINT received — shutting down gracefully.');
    clearInterval(_keepalive);
    process.exit(0);
  });

  // Prevent unhandled promise rejections from crashing the stdio server
  process.on('unhandledRejection', (reason) => {
    console.error(`[MCP-Bridge] Unhandled rejection suppressed: ${reason}`);
  });
  process.on('uncaughtException', (err) => {
    console.error(`[MCP-Bridge] Uncaught exception suppressed: ${err.message}`);
  });

  // Load tools after keys are securely injected
  loadAllBridgeTools();

  logToShadowLedger({
    type: 'mcp_server_start',
    version: bridgeConfig.bridgeVersion,
    totalTools: MCP_TOOLS.length,
    enforcement: bridgeConfig.enforcementMode
  });

  server.onerror = (err) => console.error(`[MCP-SDK-ERROR] ${err.message}`);
  const transport = new StdioServerTransport();
  transport.onerror = (err) => console.error(`[MCP-TRANSPORT-ERROR] ${err.message}`);
  await server.connect(transport);
  console.error(`[MCP-Bridge] ✅ Sovereign stdio MCP bridge active — ${MCP_TOOLS.length} tools loaded`);
}

main().catch((error) => {
  console.error(`[MCP-Bridge] Fatal: ${error.message}`);
  process.exit(1);
});
