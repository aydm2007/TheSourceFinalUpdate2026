#!/usr/bin/env node
/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  🔧 Bridge CLI — Universal wrapper for IDE agent compliance │
 * │  Usage: node scripts/bridge_cli.js <ToolName> [JSON args]   │
 * │                                                              │
 * │  Enables IDE agents to execute bridge tools via run_command  │
 * │  with full BridgeEnforcer authorization + shadow_ledger log  │
 * └─────────────────────────────────────────────────────────────┘
 */

const path = require('path');
const fs = require('fs');

// Suppress bridge init noise
const origLog = console.error;
const origWarn = console.warn;
console.error = () => {};
console.warn = () => {};

let executeTool;
try {
  const bridge = require('../nexus_bridge.js');
  executeTool = bridge.executeTool;
} catch (e) {
  console.error = origLog;
  console.error(`[Bridge-CLI] Failed to load nexus_bridge.js: ${e.message}`);
  process.exit(1);
}

console.error = origLog;
console.warn = origWarn;

// ─── Shadow Ledger ──────────────────────────────────────────────
const ledgerPath = path.join(__dirname, '..', '.agents', 'memory', 'shadow_ledger.jsonl');

function logToBridgeLedger(entry) {
  const record = {
    timestamp: new Date().toISOString(),
    source: 'BRIDGE_CLI',
    ...entry
  };
  try {
    fs.appendFileSync(ledgerPath, JSON.stringify(record) + '\n');
  } catch (e) { /* non-critical */ }
}

// ─── Bridge Authorization ───────────────────────────────────────
const bridgeJsonPath = path.join(__dirname, '..', 'bridge.json');
let allowedTools = [];
try {
  const config = JSON.parse(fs.readFileSync(bridgeJsonPath, 'utf-8'));
  allowedTools = config.allowed_tools || [];
} catch (e) {
  console.error('[Bridge-CLI] WARNING: Cannot load bridge.json — running without authorization');
}

// ─── Parse Arguments ────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.error(`
╔════════════════════════════════════════════════════╗
║  🔧 Bridge CLI — Nexus Bridge Tool Wrapper         ║
╠════════════════════════════════════════════════════╣
║  Usage:                                            ║
║    node bridge_cli.js <ToolName> [JSON_args]        ║
║                                                    ║
║  Examples:                                          ║
║    node bridge_cli.js FileRead '{"file_path":"a.ts"}'║
║    node bridge_cli.js OmegaDiagnostic              ║
║    node bridge_cli.js GraphMemorySync '{"files":[]}' ║
║    node bridge_cli.js RealtimeScan '{"file_path":"x"}'║
║    node bridge_cli.js FullRepairLoop               ║
║                                                    ║
║  Available Tools (${allowedTools.length}):                            ║
║    ${allowedTools.slice(0, 10).join(', ')}...       ║
╚════════════════════════════════════════════════════╝
  `);
  process.exit(0);
}

const toolName = args[0];
let toolArgs = {};

if (args.length > 1) {
  try {
    // Join all remaining args (handles PowerShell splitting on spaces)
    let jsonStr = args.slice(1).join(' ');
    // Handle PowerShell double-quote escaping: {"" → {"
    jsonStr = jsonStr.replace(/""/g, '"');
    // Handle key=value shorthand: ToolName key1=val1 key2=val2
    if (!jsonStr.startsWith('{')) {
      const kvPairs = {};
      for (const part of args.slice(1)) {
        const firstEq = part.indexOf('=');
        if (firstEq > -1) {
          const k = part.substring(0, firstEq);
          let v = part.substring(firstEq + 1);
          try { v = JSON.parse(v); } catch(e) {} // auto-parse inner JSON if possible
          kvPairs[k] = v;
        }
      }
      if (Object.keys(kvPairs).length > 0) {
        toolArgs = kvPairs;
      }
    } else {
      toolArgs = JSON.parse(jsonStr);
    }
  } catch (e) {
    console.error(`[Bridge-CLI] Invalid JSON: ${e.message}`);
    console.error(`[Bridge-CLI] TIP: Use key=value syntax instead: node bridge_cli.js FileRead file_path=src/main.ts`);
    process.exit(1);
  }
}

// ─── Authorization Check ─────────────────────────────────────────
if (allowedTools.length > 0 && !allowedTools.includes(toolName)) {
  const msg = `[Bridge-CLI] SOVEREIGN BREACH: Tool '${toolName}' is NOT authorized in bridge.json`;
  logToBridgeLedger({ type: 'bridge_cli_violation', tool: toolName, status: 'DENIED' });
  console.error(msg);
  process.exit(1);
}

// ─── Execute ─────────────────────────────────────────────────────
const startTime = Date.now();

logToBridgeLedger({ type: 'bridge_cli_call', tool: toolName, args: toolArgs });

executeTool(toolName, toolArgs)
  .then(result => {
    const duration = Date.now() - startTime;
    logToBridgeLedger({
      type: 'bridge_cli_result',
      tool: toolName,
      status: 'SUCCESS',
      durationMs: duration
    });

    if (typeof result === 'string') {
      console.error(result);
    } else {
      console.error(JSON.stringify(result, null, 2));
    }
  })
  .catch(error => {
    const duration = Date.now() - startTime;
    logToBridgeLedger({
      type: 'bridge_cli_result',
      tool: toolName,
      status: 'FAILED',
      error: error.message,
      durationMs: duration
    });
    console.error(`[Bridge-CLI] Error: ${error.message}`);
    process.exit(1);
  });
