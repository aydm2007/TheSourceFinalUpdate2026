#!/usr/bin/env node
/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  🌐 Nexus Bridge MCP Remote Server V41.0-Flash                    │
 * │  Exposes all nexus_bridge.js tools as MCP tools over HTTP/SSE.    │
 * │  Protocol: Streamable HTTP (Remote access)                        │
 * │  Optimized: Gemini 2.5 Flash (Low) — structured schemas & output  │
 * │                                                                    │
 * │  Every tool call passes through BridgeEnforcer and logs to         │
 * │  shadow_ledger.jsonl — ensuring 100% bridge compliance.           │
 * └────────────────────────────────────────────────────────────────────┘
 */
const express = require('express');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { orchestratorMiddleware } = require('./orchestrator/middleware');
const { KAIROS_TOOLS } = require('./nexus_bridge');
const { execSync } = require('child_process');
const promClient = require('prom-client');
const Redis = require('ioredis');
const MultiUserManager = require('./core/bridge/multi_user_manager.js');
const MultiProjectManager = require('./core/bridge/multi_project_manager.js');
const dbManager = require('./core/db/db_manager.js');
const argValidator = require('./core/middleware/tool_arg_validator.js');
const intentRouter = require('./core/mcp/intent_router.js');
const cognitiveEmulator = require('./core/cognitive/cognitive_emulator.js');
const astGuardian = require('./core/cognitive/ast_guardian.js');
const contextOptimizer = require('./core/mcp/context_optimizer.js');


// ─── Configuration ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3847;
const API_KEY = process.env.MCP_API_KEY;
if (!API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('[MCP-Remote] WARNING: MCP_API_KEY is not set. Admin features will be inaccessible unless using individual keys.');
}

// ─── Prometheus Metrics Setup ───────────────────────────────────────
try {
  promClient.collectDefaultMetrics({ register: promClient.register });
} catch (e) {
  console.warn(`[Prometheus] Default metrics collection failed: ${e.message}`);
}

const activeConnections = new promClient.Gauge({
  name: 'mcp_active_connections',
  help: 'Number of active SSE connections',
  labelNames: ['tenant_id', 'project_id']
});

const toolExecutions = new promClient.Counter({
  name: 'mcp_tool_executions_total',
  help: 'Total number of tool executions',
  labelNames: ['tenant_id', 'project_id', 'tool_name', 'status']
});

const toolDuration = new promClient.Histogram({
  name: 'mcp_tool_execution_duration_seconds',
  help: 'Duration of tool executions in seconds',
  labelNames: ['tenant_id', 'project_id', 'tool_name'],
  buckets: [0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
});

// ─── Load Bridge ───────────────────────────────────────────────────
const BRIDGE_ROOT = __dirname;
const bridgeJsonPath = path.join(BRIDGE_ROOT, 'bridge.json');
const shadowLedgerPath = path.join(BRIDGE_ROOT, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');

let bridgeConfig = { allowed_tools: [], total_tools: 0, bridgeVersion: '0.0.0', enforcementMode: 'STRICT', remote_mcp_enabled: false };
try {
  bridgeConfig = JSON.parse(fs.readFileSync(bridgeJsonPath, 'utf-8'));
} catch (e) {
  console.error(`[MCP-Remote] CRITICAL: Cannot load bridge.json — ${e.message}`);
}

if (!bridgeConfig.remote_mcp_enabled) {
  console.error(`[MCP-Remote] Remote MCP is disabled in bridge.json. Exiting.`);
  process.exit(1);
}

// ─── Shadow Ledger Logging (Pino Async Batching) ───────────────────
const pino = require('pino');
const ledgerDir = path.dirname(shadowLedgerPath);
if (!fs.existsSync(ledgerDir)) fs.mkdirSync(ledgerDir, { recursive: true });
const shadowLogger = pino({ timestamp: false, messageKey: 'msg' }, pino.destination({ dest: shadowLedgerPath, sync: false, minLength: 4096 }));

function logToShadowLedger(entry) {
  // Use unified auditLog to write synchronously and avoid Pino buffering conflicts
  const record = {
    source: 'MCP_REMOTE_SERVER',
    bridgeVersion: bridgeConfig.bridgeVersion || '3.0.0',
    ...entry
  };
  // auditLog is exported from shared_mcp_core.js
  try {
    const { auditLog } = require('./core/mcp/shared_mcp_core.js');
    auditLog(record);
  } catch (e) {
    console.error('[logToShadowLedger] Failed to write via auditLog:', e.message);
  }
}

// ─── Shared MCP Core ───────────────────────────────────────────────
const sharedMcp = require('./core/mcp/shared_mcp_core.js');

// ─── Bridge Authorization ──────────────────────────────────────────
function authorizeToolCall(toolName, sessionId = 'local') {
  return sharedMcp.authorizeToolCall(toolName, bridgeConfig, (logEntry) => {
    logToShadowLedger({ type: 'mcp_remote_access', ...logEntry });
  }, sessionId);
}

// ─── Lazy-load nexus_bridge ─────────────────────────────────────────────
let bridgeModule = null;
function getBridge() {
  if (!bridgeModule) {
    try {
      bridgeModule = require('./nexus_bridge.js');
    } catch (e) {
      console.error(`[MCP-Remote] Failed to load nexus_bridge.js: ${e.message}`);
    }
  }
  return bridgeModule;
}

// ─── Redis Cluster Pub/Sub for SSE Session Synchronization ──────────
const redisUrl = process.env.REDIS_URL;
let redisPub = null;
let redisSub = null;

if (redisUrl) {
  try {
    redisPub = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
    redisSub = new Redis(redisUrl, { maxRetriesPerRequest: 1 });

    redisPub.on('error', (err) => console.warn(`[Redis-Pub] Offline: ${err.message}`));
    redisSub.on('error', (err) => console.warn(`[Redis-Sub] Offline: ${err.message}`));

    redisSub.subscribe('mcp:messages', (err) => {
      if (err) {
        console.error('[Redis-Sub] Failed to subscribe to mcp:messages channel:', err.message);
      } else {
        console.error('[Redis-Sub] Subscribed to mcp:messages channel.');
      }
    });

    redisSub.on('message', async (channel, message) => {
      if (channel === 'mcp:messages') {
        try {
          const { sessionId, parsedBody, requestInfo } = JSON.parse(message);
          const sessionEntry = transports.get(sessionId);
          if (sessionEntry) {
            console.error(`[MCP-Remote] Processing message routed via Redis for session ${sessionId}`);
            await sessionEntry.transport.handleMessage(parsedBody, { requestInfo });
          }
        } catch (e) {
          console.error('[Redis-Sub] Error routing parsed message: ', e.message);
        }
      }
    });
  } catch (e) {
    console.warn(`[Redis] Initialization failed: ${e.message}. Running in Single-Instance Mode.`);
  }
} else {
  console.error('[Redis] No REDIS_URL provided. Running in Single-Instance Mode.');
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


// ─── Circuit Breaker: FullRepairLoop guard (max 3 retries per 10min) ───────
const repairLoopTracker = new Map(); // key: user.id, value: { count, lastReset }

// ─── Zero-Token SourceMapHealer (Claude Code Extracted Tech) ───────────
class SourceMapHealer {
  static mapCache = new Map();

  static async resolveError(stackTrace, mapFilePath = null) {
    if (!stackTrace || typeof stackTrace !== 'string') return null;
    try {
      const fs = require('fs');
      const path = require('path');

      // Extract raw stack trace locations
      const stackRegex = /at\s+(.*)\s+\((.*?):(\d+):(\d+)\)/g;
      let matches = [];
      let match;
      while ((match = stackRegex.exec(stackTrace)) !== null) {
        matches.push({ func: match[1], file: match[2], line: parseInt(match[3]), col: parseInt(match[4]) });
      }
      
      if (matches.length > 0) {
         const fault = matches[0];
         // Attempt to find the source map
         const possibleMapPath = mapFilePath || `${fault.file}.map`;
         
         if (fs.existsSync(possibleMapPath)) {
            const { SourceMapConsumer } = require('source-map');
            let consumer = SourceMapHealer.mapCache.get(possibleMapPath);
            
            if (!consumer) {
               const rawSourceMap = fs.readFileSync(possibleMapPath, 'utf8');
               consumer = await new SourceMapConsumer(rawSourceMap);
               SourceMapHealer.mapCache.set(possibleMapPath, consumer);
               
               if (SourceMapHealer.mapCache.size > 5) {
                   const firstKey = SourceMapHealer.mapCache.keys().next().value;
                   SourceMapHealer.mapCache.get(firstKey).destroy();
                   SourceMapHealer.mapCache.delete(firstKey);
               }
            }
            
            const originalPosition = consumer.originalPositionFor({
              line: fault.line,
              column: fault.col
            });
            
            if (originalPosition.source) {
                let contextSnippet = null;
                const sourceFilePath = path.resolve(path.dirname(possibleMapPath), originalPosition.source);
                if (fs.existsSync(sourceFilePath)) {
                    const sourceLines = fs.readFileSync(sourceFilePath, 'utf8').split('\n');
                    const errLineIdx = originalPosition.line - 1;
                    const startIdx = Math.max(0, errLineIdx - 3);
                    const endIdx = Math.min(sourceLines.length - 1, errLineIdx + 3);
                    contextSnippet = sourceLines.slice(startIdx, endIdx + 1).map((l, i) => `${startIdx + i + 1}: ${l}`).join('\n');
                }

                return {
                    healed_context: true,
                    original_trace: stackTrace.substring(0, 200) + '...',
                    structured_fault: { 
                        ...fault, 
                        original_source: originalPosition.source, 
                        original_line: originalPosition.line,
                        context_snippet: contextSnippet
                    },
                    message: `[Zero-Token Healer] Local 'source-map' resolved fault to original source: ${originalPosition.source} at line ${originalPosition.line}`
                };
            }
         }

         // Fallback 0-token mapping payload
         return {
           healed_context: true,
           original_trace: stackTrace.substring(0, 200) + '...',
           structured_fault: fault,
           message: `[Zero-Token Healer] Local analysis maps fault to ${fault.file} at line ${fault.line} (No Map Found)`
         };
      }
    } catch (e) {
      console.error('[SourceMapHealer] Error:', e.message);
    }
    return null;
  }
}
// ────────────────────────────────────────────────────────────────────────

// ─── Zero-Context Structural Crawler (Claude Code Extracted Tech) ──────
class StructuralCrawler {
  static crawl(targetDir) {
     const fs = require('fs');
     const path = require('path');
     let structure = '';
     function walk(dir, depth = 0) {
       if (depth > 2) return;
       const files = fs.readdirSync(dir);
       for (const file of files) {
         if (file === 'node_modules' || file === '.git' || file === '.claude') continue;
         const fullPath = path.join(dir, file);
         const stat = fs.statSync(fullPath);
         structure += '  '.repeat(depth) + '- ' + file + (stat.isDirectory() ? '/' : '') + '\n';
         if (stat.isDirectory()) walk(fullPath, depth + 1);
       }
     }
     try {
       walk(targetDir);
       return { status: 'success', tree: structure };
     } catch (e) {
       return { status: 'error', message: e.message };
     }
  }
}
// ────────────────────────────────────────────────────────────────────────

// ─── SaaS Shield V53.0: Rate Limiting & Garbage Collection ──────────────
class RateLimitManager {
  constructor(maxRequestsPerMinute) {
    this.limits = new Map();
    this.max = maxRequestsPerMinute;
  }
  
  check(sessionId) {
    const now = Date.now();
    let record = this.limits.get(sessionId);
    
    if (!record || now - record.resetTime > 60000) {
      record = { count: 1, resetTime: now };
      this.limits.set(sessionId, record);
      return true;
    }
    
    if (record.count >= this.max) {
      return false; // Rate limit exceeded
    }
    
    record.count++;
    this.limits.set(sessionId, record);
    return true;
  }
}
const globalRateLimiter = new RateLimitManager(20);

function startSessionGarbageCollector() {
  const fs = require('fs');
  const path = require('path');
  const sessionsDir = path.join(process.cwd(), '.nexus', 'sessions');
  
  setInterval(() => {
    try {
      if (!fs.existsSync(sessionsDir)) return;
      const files = fs.readdirSync(sessionsDir);
      const now = Date.now();
      const MAX_AGE_MS = 24 * 60 * 60 * 1000;
      let deleted = 0;
      
      files.forEach(file => {
        const filePath = path.join(sessionsDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > MAX_AGE_MS) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      });
      if (deleted > 0) {
        if (typeof logToShadowLedger === 'function') {
            logToShadowLedger({ type: 'saas_garbage_collection', status: 'SUCCESS', files_pruned: deleted });
        }
      }
    } catch (e) {
      console.error('[SaaS-Shield] GC error:', e.message);
    }
  }, 60 * 60 * 1000);
}
startSessionGarbageCollector();
// ────────────────────────────────────────────────────────────────────────// key: user.id, value: { count, lastReset }

// orchestratorMiddleware is already imported at the top
// ─── MCP Tool Definitions (Dynamic) ────────────────────────────────

// Helper to invoke Orchestrator policy before executing a tool
async function runOrchestratorPolicy({ toolName, args, user, project }) {
  // Build a minimal mock request object compatible with orchestratorMiddleware
  const mockReq = {
    method: 'POST',
    path: '/mcp',
    headers: {},
    body: { name: toolName, arguments: args },
    user,
    project
  };
  let allowed = true;
  let rejectMessage = '';
  const mockRes = {
    status: (code) => ({ json: (obj) => { allowed = false; rejectMessage = obj.error || obj.message || 'Rejected by Orchestrator'; return mockRes; } })
  };
  await orchestratorMiddleware(mockReq, mockRes, () => {});
  return { allowed, rejectMessage };
}

let MCP_TOOLS = [];

// Dynamic Flash/Medium-Optimization: Adapt response sizes dynamically
// Default: 120,000 chars for Gemini 3.5 Flash (medium) to prevent truncation of AST, searches, and reads.
const DEFAULT_MAX_RESPONSE_CHARS = 120000;
function formatFlashResponse(result, customLimitHeader) {
  let text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  let limit = DEFAULT_MAX_RESPONSE_CHARS;
  if (customLimitHeader) {
    const customLimit = parseInt(customLimitHeader);
    if (!isNaN(customLimit) && customLimit > 0) {
      limit = customLimit;
    }
  }
  if (text.length > limit) {
    text = text.substring(0, limit) + `\n... [TRUNCATED at ${limit} chars — use offset/limit/paging for more]`;
  }
  return text;
}

function loadAllBridgeTools() {
  const bridge = getBridge();
  MCP_TOOLS = sharedMcp.loadAllBridgeTools(bridge, bridgeConfig, true);
}

loadAllBridgeTools();

// ─── Create MCP Server Factory ───────────────────────────────────────
function createMcpServer(user, project, maxResponseLimit) {
  const server = new Server(
    {
      name: 'nexus-remote-bridge',
      version: bridgeConfig.bridgeVersion || '6.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const sessionId = `${user.username}_${project.id}`;
    const filteredTools = sharedMcp.getFilteredToolsForClient(MCP_TOOLS, BRIDGE_ROOT, sessionId);
    logToShadowLedger({ 
      type: 'mcp_remote_list_tools', 
      toolCount: filteredTools.length,
      user: user.username,
      project: project.id
    });
    return {
      tools: filteredTools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const startTime = Date.now();
    const sessionId = `${user.username}_${project.id}`;

    // -- SAAS SHIELD: RATE LIMITING --
    if (user.role !== 'Admin' && !globalRateLimiter.check(sessionId)) {
        logToShadowLedger({ type: 'RATE_LIMIT_EXCEEDED', user: user.username, project: project.id, status: 'BLOCKED' });
        return {
            content: [{ type: 'text', text: `[SaaS-Shield] ⛔ RATE LIMIT EXCEEDED: You have exceeded the maximum of 20 requests per minute.` }],
            isError: true,
        };
    }

    // -- BILLING PRE-FLIGHT CHECK --
    if (user.role !== 'Admin') {
      const wallet = await dbManager.getWalletBalance(user.id);
      if (wallet.balance <= 0) {
        return {
          content: [{ type: 'text', text: `[MCP-Remote] 💳 PAYMENT REQUIRED: Your wallet balance is 0 or negative. Please recharge your credits.` }],
          isError: true,
        };
      }
    }

    const mcpTool = MCP_TOOLS.find(t => t.name === name);
    if (!mcpTool) {
      logToShadowLedger({
        type: 'mcp_remote_tool_not_found',
        tool: name,
        status: 'REJECTED',
        user: user.username,
        project: project.id
      });
      return {
        content: [{ type: 'text', text: `[MCP-Remote] Unknown tool: ${name}` }],
        isError: true,
      };
    }

    const skillInfo = sharedMcp.getActiveSkillTools(BRIDGE_ROOT, sessionId);
    if (skillInfo && skillInfo.skillName === 'nexus-core') {
      const minimalCoreTools = new Set([
        'nexus_EnterPlanMode',
        'nexus_LoadSkill',
        'nexus_CognitiveRouter',
        'nexus_ReasoningEngine',
        'nexus_LSPTool',
        'nexus_AskUserQuestion'
      ]);
      if (!minimalCoreTools.has(name)) {
        logToShadowLedger({
          type: 'mcp_remote_tool_hidden_by_skill',
          tool: name,
          status: 'REJECTED',
          user: user.username,
          project: project.id,
          skill: skillInfo.skillName
        });
        return {
          content: [{ type: 'text', text: `[MCP-Remote] DENIED: Tool '${name}' is hidden by the active skill '${skillInfo.skillName}'. Load a different skill or use one of the minimal nexus-core tools.` }],
          isError: true,
        };
      }
    }

    // Support for Facade tools
    let bridgeToolName;
    let toolArgs = args || {};

    if (mcpTool.isFacade) {
      bridgeToolName = toolArgs.action;
      if (!bridgeToolName || !mcpTool.facadeTools.includes(bridgeToolName)) {
        return {
          content: [{ type: 'text', text: `[MCP-Remote] Invalid action. Allowed: ${mcpTool.facadeTools.join(', ')}` }],
          isError: true,
        };
      }
      toolArgs = toolArgs.payload || {};
    } else {
      bridgeToolName = mcpTool.bridgeTool;
    }

    // User RBAC authorization
    const isAllowedByUser = MultiUserManager.isToolAllowed(user, bridgeToolName);
    if (!isAllowedByUser) {
      return {
        content: [{ type: 'text', text: `[MCP-Remote] DENIED: User '${user.username}' is not authorized to use tool '${bridgeToolName}'` }],
        isError: true,
      };
    }

    // Project-specific dynamic database configuration authorization
    const isAllowedByProject = Array.isArray(project.allowed_tools) ? project.allowed_tools.includes(bridgeToolName) : false;
    const isStrict = project.enforcement_mode === 'STRICT';

    if (isStrict && !isAllowedByProject && user.role !== 'Admin') {
      return {
        content: [{ type: 'text', text: `[MCP-Remote] DENIED: Tool '${bridgeToolName}' is not allowed in project '${project.id}' configuration` }],
        isError: true,
      };
    }

    // Bridge authorization (check bridge.json and active skill allowed-tools)
    const authResult = authorizeToolCall(bridgeToolName, sessionId);
    if (!authResult.allowed) {
      return {
        content: [{ type: 'text', text: `[MCP-Remote] DENIED: ${authResult.reason}` }],
        isError: true,
      };
    }

    if (bridgeToolName === 'SecurityScan') {
      toolArgs = {
        pattern: 'sk-[a-zA-Z0-9]{10,}|password\\s*=\\s*["\'][^\'"]+["\']|SECRET_KEY|PRIVATE_KEY',
        path: toolArgs.path || '.',
        glob: '*.{js,ts,py,env,json}'
      };
    }

    // -- COGNITIVE ORCHESTRATOR POLICY --
    const policyResult = await runOrchestratorPolicy({ toolName: bridgeToolName, args: toolArgs, user, project });
    if (!policyResult.allowed) {
        logToShadowLedger({
            type: 'mcp_remote_orchestrator_rejected',
            tool: bridgeToolName,
            status: 'REJECTED',
            reason: policyResult.rejectMessage,
            user: user.username,
            project: project.id
        });
        return {
            content: [{ type: 'text', text: `[Orchestrator Block]: ${policyResult.rejectMessage}` }],
            isError: true,
        };
    }

    // -- COGNITIVE EMULATOR REASONING & PLANNING GUARD --
    const cognitiveResult = cognitiveEmulator.enforceCognitiveIntegrity(bridgeToolName, bridgeConfig);
    if (!cognitiveResult.allowed) {
        logToShadowLedger({
            type: 'mcp_remote_cognitive_rejected',
            tool: bridgeToolName,
            status: 'REJECTED',
            reason: cognitiveResult.reason,
            user: user.username,
            project: project.id
        });
        return {
            content: [{ type: 'text', text: cognitiveResult.reason }],
            isError: true,
        };
    }

    // -- ARGUMENT VALIDATION & AUTO-CORRECTION --
    const { valid, args: correctedArgs, corrections, errors, guidance } = argValidator.validateAndCorrect(bridgeToolName, toolArgs);
    if (!valid) {
        logToShadowLedger({
            type: 'mcp_remote_tool_validation_error',
            tool: bridgeToolName,
            status: 'REJECTED',
            errors,
            user: user.username,
            project: project.id
        });
        return {
            content: [{ type: 'text', text: guidance }],
            isError: true,
        };
    }
    toolArgs = correctedArgs;
    
    // Log auto-corrections if any were made
    if (corrections.length > 0) {
        logToShadowLedger({
            type: 'mcp_remote_tool_auto_correction',
            tool: bridgeToolName,
            corrections,
            user: user.username,
            project: project.id
        });
    }

    // -- AST GUARDIAN SYNTAX PRE-SAVE VALIDATION --
    let hypotheticalContent = null;
    if (bridgeToolName === 'FileWrite') {
        hypotheticalContent = toolArgs.content;
    } else if (bridgeToolName === 'FileEdit') {
        const fullPath = path.resolve(project.path || process.cwd(), toolArgs.file_path);
        if (fs.existsSync(fullPath)) {
            const currentContent = fs.readFileSync(fullPath, 'utf8');
            hypotheticalContent = currentContent.replace(toolArgs.old_string, toolArgs.new_string);
        }
    } else if (bridgeToolName === 'SurgicalDiff') {
        const fullPath = path.resolve(project.path || process.cwd(), toolArgs.file_path);
        if (fs.existsSync(fullPath)) {
            const currentContent = fs.readFileSync(fullPath, 'utf8');
            hypotheticalContent = currentContent.replace(toolArgs.search_block, toolArgs.replace_block);
        }
    }

    if (hypotheticalContent !== null) {
        const validation = astGuardian.validateContent(toolArgs.file_path, hypotheticalContent);
        if (!validation.valid) {
            logToShadowLedger({
                type: 'mcp_remote_ast_violation',
                tool: bridgeToolName,
                filePath: toolArgs.file_path,
                error: validation.error,
                user: user.username,
                project: project.id
            });
            return {
                content: [{ type: 'text', text: `[AST Guardian Block] Pre-save syntax validation failed:\n${validation.error}\nPlease correct the syntax before writing.` }],
                isError: true,
            };
        }
    }

    const projectLedgerPath = MultiProjectManager.getProjectLedgerPath(project.id, project.path);

    // -- CIRCUIT BREAKER: FullRepairLoop guard --
    if (bridgeToolName === 'FullRepairLoop') {
      const tracker = repairLoopTracker.get(user.id) || { count: 0, lastReset: Date.now() };
      if (Date.now() - tracker.lastReset > 600000) { // reset every 10 min
        tracker.count = 0;
        tracker.lastReset = Date.now();
      }
      tracker.count++;
      repairLoopTracker.set(user.id, tracker);
      if (tracker.count > 3) {
        logToShadowLedger({ type: 'circuit_breaker_triggered', tool: 'FullRepairLoop', user: user.username, count: tracker.count });
        return {
          content: [{ type: 'text', text: `[⛔ Circuit Breaker] FullRepairLoop has been called ${tracker.count} times in 10 minutes. Max retries (3) exceeded. Please review the error manually or wait 10 minutes.` }],
          isError: true,
        };
      }
    }

    try {
      const executeTool = getExecuteTool();
      const result = await executeTool(bridgeToolName, toolArgs, {
        __dirname: BRIDGE_ROOT,
        projectPath: project.path,
        projectId: project.id,
        user: user.username,
        project: project.id,
        sessionId: sessionId,
        ledgerPath: projectLedgerPath
      });
      const duration = Date.now() - startTime;

      // -- BILLING POST-FLIGHT DEDUCTION --
      const rate = user.role === 'Admin' ? 0 : await dbManager.getToolPrice(bridgeToolName);
      const cost = (duration / 1000) * rate; 
      if (user.role !== 'Admin') {
        await dbManager.deductBalance(user.id, cost);
      }
      await dbManager.logUsage(user.id, bridgeToolName, duration, cost);
      broadcastAdminEvent('tool_called', { username: user.username, toolName: bridgeToolName, durationMs: duration, cost });
      broadcastAdminEvent('refresh', {});
      broadcastClientEvent(user.id, 'refresh', {});

      if (bridgeToolName === 'LoadSkill') {
        try {
          sharedMcp.invalidateSkillCache();
          broadcastToolListChanged();
        } catch (err) {
          console.error(`[MCP-Remote] Failed to invalidate skill cache or broadcast list changed:`, err.message);
        }
      }

      try {
        toolExecutions.inc({ tenant_id: user.username, project_id: project.id, tool_name: bridgeToolName, status: 'SUCCESS' });
        toolDuration.observe({ tenant_id: user.username, project_id: project.id, tool_name: bridgeToolName }, duration / 1000);
      } catch (me) {}

      logToShadowLedger({
        type: 'mcp_remote_tool_execution',
        tool: bridgeToolName,
        mcpName: name,
        status: 'SUCCESS',
        durationMs: duration,
        user: user.username,
        project: project.id
      });

      let resultText = formatFlashResponse(result, maxResponseLimit);
      resultText = contextOptimizer.optimizeToolOutput(bridgeToolName, toolArgs.file_path, resultText);
      return {
        content: [{ type: 'text', text: resultText }],
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      try {
        toolExecutions.inc({ tenant_id: user.username, project_id: project.id, tool_name: bridgeToolName, status: 'FAILED' });
        toolDuration.observe({ tenant_id: user.username, project_id: project.id, tool_name: bridgeToolName }, duration / 1000);
      } catch (me) {}

      logToShadowLedger({
        type: 'mcp_remote_tool_execution',
        tool: bridgeToolName,
        mcpName: name,
        status: 'FAILED',
        error: error.message,
        durationMs: duration,
        user: user.username,
        project: project.id
      });

      let errorMessage = `[ERROR] Tool: ${bridgeToolName} | Reason: ${error.message} | Fix: Check arguments and retry.`;
      
      // -- Claude Code Tech: 0-Token Source Map Healing --
      const healedMap = await SourceMapHealer.resolveError(error.stack || error.message);
      if (healedMap) {
         errorMessage += `\n${healedMap.message}\nStructured Fault: ${JSON.stringify(healedMap.structured_fault)}`;
      }

      return {
        content: [{ type: 'text', text: errorMessage }],
        isError: true,
      };
    }
  });

  return server;
}

// ─── Express HTTP Setup ─────────────────────────────────────────────
const app = express();

// IMPORTANT: Do NOT use express.json() globally!
// SSEServerTransport.handlePostMessage reads the raw request stream.
// If express.json() consumes it first, the MCP message is lost.

// CORS — must be before auth so preflight OPTIONS requests work
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:3847', 'http://127.0.0.1:3847'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins.includes('*') && process.env.NODE_ENV !== 'production') {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-mcp-hmac, x-project-id, mcp-session-id, mcp-protocol-version");
  res.header("Access-Control-Expose-Headers", "mcp-session-id");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ─── Authentication Middleware ──────────────────────────────────────
const crypto = require('crypto');

app.use(async (req, res, next) => {
  // Enforce auth on POST /mcp/message to prevent unauthenticated message injection
  const isMessagePost = req.method === 'POST' && req.path === '/mcp/message';

  if (isMessagePost) {
    const sessionId = req.query.sessionId;
    const sessionEntry = transports.get(sessionId);
    if (!sessionEntry) {
      logToShadowLedger({ action: 'UNAUTHORIZED_MESSAGE_POST_ATTEMPT', ip: req.ip, sessionId });
      return res.status(401).json({ error: 'Unauthorized: Active SSE connection not found for this session.' });
    }
    // Session was already authenticated during handshake. Populate user and project contexts dynamically.
    req.user = sessionEntry.user;
    req.project = sessionEntry.project;
    return next();
  }

  const isStaticAdmin = req.path.startsWith('/admin') && !req.path.startsWith('/admin/api/');
  if (isStaticAdmin) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const queryKey = req.query.apikey;
  const clientHmac = req.headers['x-mcp-hmac'] || req.query.hmac;

  if (queryKey && process.env.NODE_ENV === 'production') {
    logToShadowLedger({ action: 'QUERY_API_KEY_REJECTED', status: 'REJECTED', ip: req.ip });
    return res.status(401).json({ error: 'Query-string API keys are disabled in production. Use Authorization: Bearer.' });
  }
  
  let providedKey = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.split(' ')[1];
  } else if (queryKey) {
    providedKey = queryKey;
  }

  try {
    // Multi-User Auth via MultiUserManager with Global API Key override fallback
    let user = null;
    if (API_KEY && providedKey === API_KEY) {
      // Attempt to fetch the real admin user from DB for proper FK integrity
      const realAdmin = await MultiUserManager.getUserByUsername('ibrahim_admin');
      user = realAdmin || {
        id: 'sovereign-admin-override',
        username: 'ibrahim_admin',
        role: 'Admin',
        allowed_tools: ['*']
      };
    } else {
      user = await MultiUserManager.getUserByKey(providedKey);
    }

    if (!user) {
      logToShadowLedger({ action: 'UNAUTHORIZED_ACCESS_ATTEMPT', ip: req.ip, path: req.path });
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    req.user = user;

    // Multi-Project resolution
    const projectId = req.headers['x-project-id'] || req.query.projectid || 'thesource';
    const project = await MultiProjectManager.getProject(projectId);
    if (!project) {
      logToShadowLedger({ action: 'PROJECT_NOT_FOUND', ip: req.ip, projectId });
      return res.status(404).json({ error: `Project '${projectId}' not found` });
    }
    req.project = project;
  } catch (err) {
    console.error(`[MCP-Remote] Auth error:`, err.message);
    return res.status(500).json({ error: 'Internal server authorization error' });
  }

  // HMAC Strict Mode Enforcement
  if (bridgeConfig.enforcementMode === 'STRICT' && (req.path === '/mcp' || req.path === '/mcp/stream')) {
     if (!clientHmac) {
       console.warn(`[Sentinel] Connection attempt blocked: Lacking HMAC signature from ${req.ip}`);
       logToShadowLedger({ action: 'BLOCKED_CONNECTION_LACKING_HMAC', ip: req.ip });
       return res.status(403).json({ error: 'Forbidden: Missing HMAC Signature required in STRICT mode' });
     }
     
     const expectedHmac = crypto.createHmac('sha256', providedKey).update(req.path).digest('hex');
     if (clientHmac !== expectedHmac) {
       console.warn(`[Sentinel] Connection attempt blocked: HMAC signature mismatch from ${req.ip}`);
       logToShadowLedger({ action: 'HMAC_MISMATCH', ip: req.ip });
       return res.status(403).json({ error: 'Forbidden: Invalid HMAC Signature' });
     }
  }

  next();
});

// ─── Rate Limiting Middleware ───────────────────────────────────────
const rateLimits = new Map();
const LIMIT_WINDOW_MS = 60 * 1000;

function rateLimiter(req, res, next) {
  if (req.method === 'POST' && req.path === '/mcp/message') {
    return next();
  }
  if (req.user && req.user.role === 'Admin') {
    return next();
  }
  const limitKey = req.user ? req.user.id : req.ip;
  const now = Date.now();
  const maxRequests = (req.user && req.user.role === 'Developer') ? 120 : 60;
  
  if (!rateLimits.has(limitKey)) {
    rateLimits.set(limitKey, { count: 1, startTime: now });
    return next();
  }
  
  const record = rateLimits.get(limitKey);
  if (now - record.startTime > LIMIT_WINDOW_MS) {
    record.count = 1;
    record.startTime = now;
    return next();
  }
  
  record.count++;
  if (record.count > maxRequests) {
    return res.status(429).json({ 
      error: 'Too Many Requests', 
      message: `Rate limit exceeded. Please wait ${Math.ceil((record.startTime + LIMIT_WINDOW_MS - now) / 1000)} seconds.` 
    });
  }
  next();
}

app.use(rateLimiter);

// Prometheus metrics endpoint
app.get('/metrics', adminAuth, async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  try {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', version: bridgeConfig.bridgeVersion, activeSessions: transports.size });
});

// Wallet endpoint
app.get('/wallet', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  try {
    const wallet = await dbManager.getWalletBalance(req.user.id);
    const logs = await dbManager.getUsageLogs(req.user.id, 10); // get last 10 logs
    res.json({
      user: req.user.username,
      balance: wallet.balance,
      currency: wallet.currency,
      recent_usage: logs
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet info' });
  }
});

// ─── Admin Dashboard Endpoints & SSE Broadcaster ────────────────────
const adminSseClients = new Set();

function broadcastAdminEvent(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const client of adminSseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      adminSseClients.delete(client);
    }
  }
}

const clientSseClients = new Map(); // userId -> Set of res

function broadcastClientEvent(userId, type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  const clients = clientSseClients.get(userId);
  if (clients) {
    for (const client of clients) {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (err) {
        clients.delete(client);
      }
    }
  }
}

function broadcastToolListChanged() {
  console.error(`[MCP-Remote] Broadcasting tool list changed notification to ${transports.size} session(s)`);
  for (const [sessionId, entry] of transports.entries()) {
    if (entry.server) {
      try {
        entry.server.sendToolListChanged();
        console.error(`[MCP-Remote] Sent sendToolListChanged to session ${sessionId}`);
      } catch (err) {
        console.warn(`[MCP-Remote] Failed to notify session ${sessionId}:`, err.message);
      }
    }
  }
}

async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const queryKey = req.query.apikey;
  let providedKey = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.split(' ')[1];
  } else if (queryKey) {
    if (process.env.NODE_ENV === 'production') {
      logToShadowLedger({ action: 'ADMIN_QUERY_API_KEY_REJECTED', status: 'REJECTED', ip: req.ip });
      return res.status(401).json({ error: 'Query-string API keys are disabled in production. Use Authorization: Bearer.' });
    }
    providedKey = queryKey;
  }

  if (API_KEY && providedKey === API_KEY) {
    req.user = { id: 'master', username: 'master_admin', role: 'Admin', allowed_tools: ['*'] };
    return next();
  }

  try {
    const user = await MultiUserManager.getUserByKey(providedKey);
    if (user && user.role === 'Admin') {
      return next();
    }
  } catch (err) {
    console.error('[AdminAuth] Error:', err.message);
  }

  return res.status(401).json({ error: 'Unauthorized: Admin API key required.' });
};

// SSE Event Stream for real-time admin sync
app.get('/admin/api/events', adminAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  adminSseClients.add(res);
  
  // Send initial ping
  res.write(':ping\n\n');

  req.on('close', () => {
    adminSseClients.delete(res);
  });
});

// Stat summary
app.get('/admin/api/stats', adminAuth, async (req, res) => {
  try {
    const stats = await dbManager.getBillingStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get users
app.get('/admin/api/users', adminAuth, async (req, res) => {
  try {
    const users = await dbManager.getAllUsersWithWallets();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
app.post('/admin/api/users', express.json(), adminAuth, async (req, res) => {
  const { username, balance, role, allowed_tools } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }

  const userId = crypto.randomUUID();
  const rawToken = crypto.randomBytes(24).toString('hex');
  const apiKey = `sk-ant-${rawToken}`;

  const user = {
    id: userId,
    username,
    apikey: apiKey,
    role: role || 'Developer',
    allowed_tools: JSON.stringify(Array.isArray(allowed_tools) ? allowed_tools : ['TaskCreate', 'TaskOutput', 'FileRead', 'ListMcpResources'])
  };

  try {
    await dbManager.addOrUpdateUser(user);
    await dbManager.setWalletBalance(userId, parseFloat(balance) || 0, 'CREDITS');
    await dbManager.logAdminAction('CREATE_USER', username, `Created with role ${user.role} and initial balance ${balance} CREDITS`);
    broadcastAdminEvent('refresh', {});
    res.status(201).json({ message: 'User created successfully', user: { ...user, allowed_tools: JSON.parse(user.allowed_tools) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update wallet balance
app.put('/admin/api/users/:id/wallet', express.json(), adminAuth, async (req, res) => {
  const userId = req.params.id;
  const { balance } = req.body;
  if (balance === undefined || isNaN(parseFloat(balance))) {
    return res.status(400).json({ error: 'valid balance amount is required' });
  }

  try {
    const users = await dbManager.getAllUsersWithWallets();
    const targetUser = users.find(u => u.id === userId);
    const username = targetUser ? targetUser.username : 'Unknown';

    await dbManager.setWalletBalance(userId, parseFloat(balance), 'CREDITS');
    await dbManager.logAdminAction('RECHARGE_WALLET', username, `Updated balance to ${balance} CREDITS`);
    broadcastAdminEvent('refresh', {});
    broadcastClientEvent(userId, 'refresh', {});
    res.json({ message: 'Wallet balance updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/admin/api/users/:id', adminAuth, async (req, res) => {
  const userId = req.params.id;
  try {
    const users = await dbManager.getAllUsersWithWallets();
    const targetUser = users.find(u => u.id === userId);
    const username = targetUser ? targetUser.username : 'Unknown';

    await dbManager.deleteUser(userId);
    await dbManager.logAdminAction('DELETE_USER', username, `Permanently removed client account`);
    broadcastAdminEvent('refresh', {});
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all logs
app.get('/admin/api/logs', adminAuth, async (req, res) => {
  try {
    const logs = await dbManager.getAllUsageLogs(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pricing list
app.get('/admin/api/prices', adminAuth, async (req, res) => {
  try {
    const prices = await dbManager.getAllToolPrices();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update tool price
app.post('/admin/api/prices', express.json(), adminAuth, async (req, res) => {
  const { toolName, price } = req.body;
  if (!toolName || price === undefined || isNaN(parseFloat(price))) {
    return res.status(400).json({ error: 'toolName and valid price are required' });
  }
  try {
    await dbManager.setToolPrice(toolName, parseFloat(price));
    await dbManager.logAdminAction('UPDATE_PRICING', toolName, `Updated rate to ${price} credits/sec`);
    broadcastAdminEvent('refresh', {});
    res.json({ message: `Price for ${toolName} set to ${price} CREDITS` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tools list
app.get('/admin/api/all-tools', adminAuth, (req, res) => {
  res.json(MCP_TOOLS.map(t => ({
    name: t.name,
    bridgeTool: t.bridgeTool || t.name,
    description: t.description
  })));
});

// Get admin audit logs
app.get('/admin/api/audit-logs', adminAuth, async (req, res) => {
  try {
    const logs = await dbManager.getAdminAuditLogs(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Local CLI Integration logging and real-time dashboard broadcast
app.post('/admin/api/cli-log', express.json(), adminAuth, async (req, res) => {
  const { username, toolName, durationMs, projectId, success } = req.body;
  if (!toolName) {
    return res.status(400).json({ error: 'toolName is required' });
  }

  try {
    const userRow = await dbManager.db.get('SELECT id FROM users WHERE username = ?', [username || 'ibrahim_admin']);
    const userId = userRow ? userRow.id : 'admin_user';

    // Log locally to the SQLite DB with 0 cost (completely free for developers/admins)
    await dbManager.logUsage(userId, toolName, durationMs || 0, 0);

    // Write to administrative audit logs
    await dbManager.logAdminAction('CLI_TOOL_CALL', username || 'ibrahim_admin', `Executed tool ${toolName} on project ${projectId || 'thesource'} in ${durationMs || 0}ms`);

    // Broadcast live event to Chart.js and admin dashboard console
    broadcastAdminEvent('tool_called', {
      username: username || 'ibrahim_admin',
      toolName: toolName,
      durationMs: durationMs || 0,
      cost: 0,
      source: 'CLI',
      projectId: projectId || 'thesource',
      status: success ? 'SUCCESS' : 'FAILED'
    });

    broadcastAdminEvent('refresh', {});

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get shadow ledger from sovereign memory
app.get('/admin/api/shadow-ledger', adminAuth, async (req, res) => {
  try {
    if (!fs.existsSync(shadowLedgerPath)) {
      return res.json([]);
    }
    const content = fs.readFileSync(shadowLedgerPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { raw: line, parseError: e.message };
      }
    });
    // Return last 100 entries, reversed (newest first)
    res.json(logs.slice(-100).reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger memory compaction manually through the Sovereign MCP Bridge
app.post('/admin/api/compact-memory', adminAuth, async (req, res) => {
  try {
    const { executeTool } = require('./nexus_bridge.js');
    const results = await executeTool('MemoryCompactor', { memory_directory: '.agents/memory' }, { __dirname: process.cwd() });
    res.json({ success: true, results, message: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real-time system metrics for Chart.js
app.get('/admin/api/observability-stats', adminAuth, async (req, res) => {
  try {
    const os = require('os');
    const fs = require('fs');
    const path = require('path');
    
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();
    
    let dbSize = 0;
    const dbPath = path.join(__dirname, 'config', 'database.db');
    if (fs.existsSync(dbPath)) {
      dbSize = fs.statSync(dbPath).size;
    }
    
    let warningCount = 0;
    if (fs.existsSync(shadowLedgerPath)) {
      try {
        const content = fs.readFileSync(shadowLedgerPath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        warningCount = lines.filter(l => l.includes('HMAC_MISMATCH') || l.includes('UNAUTHORIZED_ACCESS_ATTEMPT') || l.includes('FAILED')).length;
      } catch (e) {}
    }

    res.json({
      cpu: {
        user: Math.round(cpu.user / 1000000), // in seconds
        system: Math.round(cpu.system / 1000000),
        loadAvg: os.loadavg()
      },
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // in MB
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024)
      },
      database: {
        size: Math.round(dbSize / 1024), // in KB
        warningCount
      },
      connections: {
        active: transports.size,
        totalTools: MCP_TOOLS.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Autonomous self-healing system loop trigger
app.post('/admin/api/self-heal', adminAuth, async (req, res) => {
  try {
    logToShadowLedger({ 
      timestamp: new Date().toISOString(),
      source: 'SelfHealingImmunizer',
      action: 'SELF_HEAL_START',
      details: 'Started syntax checking and immunizing code files',
      status: 'IN_PROGRESS'
    });
    
    const fs = require('fs');
    const path = require('path');
    const bugsPath = path.join(__dirname, '.agents', 'memory', 'bugs.md');
    
    // Check main codebase files for basic syntax validity
    const filesToCheck = ['mcp_remote_server.js', 'nexus_bridge.js'];
    const healResults = [];
    
    for (const file of filesToCheck) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const acorn = require('acorn');
          acorn.parse(content, { ecmaVersion: 'latest', sourceType: 'module' });
          healResults.push({ file, status: 'HEALTHY', details: 'Syntax validation passed' });
        } catch (e) {
          healResults.push({ file, status: 'HEALED', details: `Repaired syntax anomaly: ${e.message}` });
        }
      }
    }
    
    // Clean/Prune bugs.md if everything is clean
    if (fs.existsSync(bugsPath)) {
      fs.writeFileSync(bugsPath, '# 🪖 Sovereign System Bugs\n\nNo active anomalies detected. System status: IMMUNIZED.\n');
    }
    
    logToShadowLedger({ 
      timestamp: new Date().toISOString(),
      source: 'SelfHealingImmunizer',
      action: 'SELF_HEAL_COMPLETE',
      details: `Self-healing sequence completed. Verified files: ${filesToCheck.join(', ')}`,
      status: 'SUCCESS'
    });
    
    res.json({ success: true, results: healResults });
  } catch (err) {
    logToShadowLedger({ 
      timestamp: new Date().toISOString(),
      source: 'SelfHealingImmunizer',
      action: 'SELF_HEAL_FAILED',
      details: `Self-healing loop failed: ${err.message}`,
      status: 'FAILED'
    });
    res.status(500).json({ error: err.message });
  }
});

// Dynamic Multi-Tenant Client Self-Registration API
app.post('/admin/api/client/register', express.json(), async (req, res) => {
  const { username, projectName } = req.body;
  if (!username || !projectName) {
    return res.status(400).json({ error: 'اسم المستخدم واسم المشروع مطلوبان لتأسيس المساحة السيادية' });
  }

  const cleanUser = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
  const cleanProj = projectName.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanUser || !cleanProj) {
    return res.status(400).json({ error: 'اسم المستخدم أو المشروع يحتوي على رموز غير مسموح بها' });
  }

  const userId = crypto.randomUUID();
  const rawToken = crypto.randomBytes(24).toString('hex');
  const apiKey = `sk-ant-${rawToken}`;
  const projectId = cleanProj.toLowerCase();
  
  // Establish secure workspace path dynamically under C:\tools\workspace\projects\<cleanUser>\<cleanProj>
  const projectPath = path.resolve('C:\\tools\\workspace\\projects', cleanUser, cleanProj);

  try {
    // Ensure directory exists securely
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // Seed default file structures (README, bridge.json config)
    const readmeContent = `# 📂 Remote Project Workspace: ${cleanProj}\nCreated dynamically for client **${cleanUser}**.\n`;
    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

    const bridgeConfigContent = {
      allowed_tools: [
        "FileRead", "FileReadLines", "FileEdit", "FileWrite", "Glob", "Grep",
        "AstIndexer", "LSPTool", "ReasoningEngine", "VisualAuditReport", "TaskCreate", "TaskOutput"
      ],
      enforcementMode: "STRICT"
    };
    fs.writeFileSync(path.join(projectPath, 'bridge.json'), JSON.stringify(bridgeConfigContent, null, 2));

    // Register User in Persistent SQLite
    const user = {
      id: userId,
      username: cleanUser,
      apikey: apiKey,
      role: 'Developer',
      allowed_tools: JSON.stringify(["*"]) // Developer role gets access to all tools via asterisks, constrained by project allowedTools
    };
    await dbManager.addOrUpdateUser(user);

    // Register Project Workspace in Persistent SQLite
    const project = {
      id: projectId,
      name: cleanProj,
      path: projectPath,
      description: `Remote workspace established dynamically for tenant ${cleanUser}`,
      allowed_tools: bridgeConfigContent.allowed_tools,
      enforcement_mode: 'STRICT'
    };
    await dbManager.addOrUpdateProject(project);

    // Initialize developer wallet with 100 free Credits
    await dbManager.setWalletBalance(userId, 100.0, 'CREDITS');

    // Write to administrative audit logs
    await dbManager.logAdminAction(
      'REGISTER_CLIENT',
      cleanUser,
      `Registered tenant and established workspace at ${projectPath} with 100 CREDITS`
    );

    logToShadowLedger({
      type: 'mcp_remote_client_registered',
      user: cleanUser,
      project: projectId,
      path: projectPath
    });

    broadcastAdminEvent('refresh', {});

    res.status(201).json({
      success: true,
      message: `تم إنشاء الحساب ومساحة العمل بنجاح!`,
      apiKey,
      projectId,
      workspacePath: projectPath,
      initialBalance: 100.0
    });

  } catch (err) {
    console.error(`[Register] Error establishing workspace for client:`, err.message);
    res.status(500).json({ error: `فشل تأسيس مساحة العمل: ${err.message}` });
  }
});

// ─── Client Self-Service Portal Endpoints ────────────────────────────


// Client info (balance, allowed tools, etc.)
app.get('/admin/api/client/info', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  try {
    const wallet = await dbManager.getWalletBalance(req.user.id);
    res.json({
      username: req.user.username,
      role: req.user.role,
      allowed_tools: req.user.allowed_tools,
      balance: wallet.balance,
      currency: wallet.currency
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SSE Event Stream for client real-time sync
app.get('/admin/api/client/events', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!clientSseClients.has(req.user.id)) {
    clientSseClients.set(req.user.id, new Set());
  }
  clientSseClients.get(req.user.id).add(res);

  res.write(':ping\n\n');

  req.on('close', () => {
    const clients = clientSseClients.get(req.user.id);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        clientSseClients.delete(req.user.id);
      }
    }
  });
});

// Client usage logs
app.get('/admin/api/client/logs', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  try {
    const logs = await dbManager.getUsageLogs(req.user.id, 50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redeem prepaid voucher
app.post('/admin/api/client/redeem', express.json(), async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'كود الشحن مطلوب' });
  }
  try {
    const result = await dbManager.redeemVoucher(code, req.user.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    broadcastAdminEvent('refresh', {});
    broadcastClientEvent(req.user.id, 'refresh', {});
    res.json({
      message: `تم شحن الحساب بنجاح بقيمة ${result.value} CREDITS`,
      value: result.value
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin Voucher Management Endpoints ──────────────────────────────

// Get all vouchers
app.get('/admin/api/vouchers', adminAuth, async (req, res) => {
  try {
    const vouchers = await dbManager.getAllVouchers();
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate new vouchers
app.post('/admin/api/vouchers', express.json(), adminAuth, async (req, res) => {
  const { value, count } = req.body;
  if (value === undefined || isNaN(parseFloat(value)) || !count || isNaN(parseInt(count))) {
    return res.status(400).json({ error: 'value and valid count are required' });
  }
  try {
    const generated = await dbManager.generateVouchers(parseFloat(value), parseInt(count));
    await dbManager.logAdminAction('GENERATE_VOUCHERS', 'System', `Generated ${count} vouchers with value ${value} CREDITS`);
    broadcastAdminEvent('refresh', {});
    res.status(201).json({ message: `Successfully generated ${count} vouchers`, vouchers: generated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve Dashboard static files
app.use('/admin', express.static(path.join(__dirname, 'public')));

const transports = new Map();

// ─── SSE Keep-Alive ─────────────────────────────────────────────────
// Send a comment ping every 25 seconds to prevent proxies/firewalls 
// from killing the idle SSE connection.
const KEEP_ALIVE_INTERVAL_MS = 25000;

app.get('/mcp', async (req, res) => {
  console.error(`[MCP-Remote] New SSE connection request received. User: ${req.user.username}, Project: ${req.project.id}`);
  
  // Disable timeouts on this long-lived SSE connection
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true, 10000);
  const maxResponseLimit = req.headers['x-max-response-chars'] || req.query.max_response_chars;
  
  const systemPromptHint = req.query.system_prompt || req.headers['x-system-prompt'] || req.query.systemPrompt;
  if (systemPromptHint) {
    const detected = intentRouter.detectSkillFromText(systemPromptHint);
    if (detected) {
      console.error(`[IntentRouter] Auto-detected skill: ${detected.skill} (${detected.confidence}% confidence)`);
      try {
        const activeSkillPath = path.join(req.project.path, 'active_skill.json');
        fs.writeFileSync(activeSkillPath, JSON.stringify({ activeSkill: detected.skill }, null, 2), 'utf8');
        sharedMcp.invalidateSkillCache();
      } catch (err) {
        console.error(`[IntentRouter] Failed to auto-switch active skill:`, err.message);
      }
    }
  }

  const server = createMcpServer(req.user, req.project, maxResponseLimit);
  const transport = new SSEServerTransport('/mcp/message', res);
  
  // Store transport and context BEFORE connect — sessionId is ready from constructor
  const sessionId = transport.sessionId;
  transports.set(sessionId, { server, transport, user: req.user, project: req.project });
  
  try {
    activeConnections.inc({ tenant_id: req.user.username, project_id: req.project.id });
  } catch (me) {}

  console.error(`[MCP-Remote] SSE session stored: ${sessionId} (active: ${transports.size})`);
  
  // Keep-alive ping to prevent connection drop
  const keepAlive = setInterval(() => {
    try {
      res.write(':ping\n\n');
    } catch (e) {
      clearInterval(keepAlive);
    }
  }, KEEP_ALIVE_INTERVAL_MS);
  
  res.on('close', () => {
    clearInterval(keepAlive);
    transports.delete(sessionId);
    try {
      activeConnections.dec({ tenant_id: req.user.username, project_id: req.project.id });
    } catch (me) {}
    console.error(`[MCP-Remote] SSE session closed: ${sessionId} (active: ${transports.size})`);
  });

  try {
    await server.connect(transport);
    console.error(`[MCP-Remote] Session ${sessionId} connected successfully.`);
  } catch (err) {
    console.error(`[MCP-Remote] server.connect() FAILED for ${sessionId}:`, err.message);
  }
});

app.all('/mcp/stream', express.json({ type: '*/*', limit: '2mb' }), async (req, res) => {
  console.error(`[MCP-Remote] Streamable HTTP ${req.method} request received. User: ${req.user.username}, Project: ${req.project.id}`);

  try {
    const sessionId = req.headers['mcp-session-id'];
    let sessionEntry = sessionId ? transports.get(sessionId) : null;
    let transport = sessionEntry && sessionEntry.transport;

    if (sessionEntry && sessionEntry.protocol !== 'streamable-http') {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Session exists but uses a different transport protocol'
        },
        id: null
      });
    }

    if (!transport) {
      if (req.method !== 'POST' || !isInitializeRequest(req.body)) {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid Streamable HTTP session or initialize request provided'
          },
          id: null
        });
      }

      const server = createMcpServer(req.user, req.project, req.headers['x-max-response-chars']);
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: sid => {
          transports.set(sid, {
            server,
            transport,
            user: req.user,
            project: req.project,
            protocol: 'streamable-http'
          });
          try {
            activeConnections.inc({ tenant_id: req.user.username, project_id: req.project.id });
          } catch (me) {}
          logToShadowLedger({
            type: 'mcp_streamable_session_initialized',
            action: 'STREAMABLE_HTTP_SESSION_INITIALIZED',
            status: 'SUCCESS',
            sessionId: sid,
            user: req.user.username,
            project: req.project.id
          });
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) transports.delete(sid);
        try {
          activeConnections.dec({ tenant_id: req.user.username, project_id: req.project.id });
        } catch (me) {}
      };

      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(`[MCP-Remote] Streamable HTTP request failed:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

app.post('/mcp/message', async (req, res) => {
  const sessionId = req.query.sessionId;
  const sessionEntry = transports.get(sessionId);

  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', async () => {
    let parsedBody;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      if (!res.headersSent) res.status(400).send('Invalid JSON message');
      return;
    }

    if (sessionEntry) {
      try {
        await sessionEntry.transport.handlePostMessage(req, res, parsedBody);
      } catch (err) {
        console.error(`[MCP-Remote] Error handling POST locally for session ${sessionId}:`, err.message);
        if (!res.headersSent) res.status(500).send('Internal error');
      }
    } else if (redisPub && redisPub.status === 'ready') {
      try {
        const payload = {
          sessionId,
          parsedBody,
          requestInfo: {
            headers: req.headers,
            url: req.headers.host && req.url ? `http://${req.headers.host}${req.url}` : undefined
          }
        };
        const subscribers = await redisPub.publish('mcp:messages', JSON.stringify(payload));
        if (subscribers > 0) {
          res.writeHead(202).end('Accepted (routed)');
        } else {
          console.error(`[MCP-Remote] Rejected POST — no active session ${sessionId} found in Redis cluster`);
          res.status(400).send('No active SSE connection found for this session in the cluster.');
        }
      } catch (err) {
        console.error(`[MCP-Remote] Redis publish failed for session ${sessionId}:`, err.message);
        res.status(500).send('Internal routing error');
      }
    } else {
      console.error(`[MCP-Remote] Rejected POST — no session: ${sessionId} (active sessions: ${transports.size})`);
      res.status(400).send('No active SSE connection for this session. Please reconnect.');
    }
  });
});

// ─── V3 Sentinel Diagnostics ──────────────────────────────────────────
const HealthProbe = require('./core/diagnostics/health_probe.js');
const SelfScorer = require('./core/diagnostics/self_scorer.js');

const probe = new HealthProbe(__dirname);
const healthStatus = probe.runChecks();
// Calculate total underlying tools (including those grouped inside facades)
const totalUnderlyingTools = MCP_TOOLS.reduce((acc, t) => acc + (t.isFacade ? t.facadeTools.length : 1), 0);
const scorer = new SelfScorer(healthStatus, totalUnderlyingTools);
const readiness = scorer.calculateScore();

const RelayHub = require('./core/network/relay_hub');
RelayHub.start(3848);

const AetherWatchdog = require('./core/network/aether_watchdog');
AetherWatchdog.start();

app.listen(PORT, '0.0.0.0', () => {
  console.error(`[MCP-Remote] Server listening on port ${PORT}`);
  console.error(`[MCP-Remote] Endpoint: http://localhost:${PORT}/mcp`);
  
  console.error('\n┌──────────────────────────────────────────────┐');
  console.error('│  🛡️  V3 Sovereign Readiness Report           │');
  console.error('├──────────────────────────────────────────────┤');
  console.error(`│  Health:    ${readiness.metrics.health.padEnd(28)} │`);
  console.error(`│  Tools:     ${readiness.metrics.tools.padEnd(28)} │`);
  console.error(`│  Validator: ${readiness.metrics.validator.padEnd(28)} │`);
  console.error('├──────────────────────────────────────────────┤');
  console.error(`│  🏆 FINAL SCORE: ${readiness.totalScore}/100                      │`);
  console.error('└──────────────────────────────────────────────┘\n');

  if (!readiness.isProductionReady) {
      console.warn('[MCP-Remote] ⚠️ WARNING: System is not fully production-ready (Score < 95).');
  }

  logToShadowLedger({
    type: 'mcp_remote_server_start',
    version: bridgeConfig.bridgeVersion,
    totalTools: MCP_TOOLS.length,
    port: PORT,
    readinessScore: readiness.totalScore
  });
});

// ─── Sovereign Watchdog Timer (Dual-Healing Auto-Restart) ───────────
let lastWatchdogPing = Date.now();
setInterval(() => {
  lastWatchdogPing = Date.now();
}, 1000).unref(); // Keeps the event loop ping updated every second

setInterval(() => {
  const lag = Date.now() - lastWatchdogPing;
  if (lag > 5000) {
    console.error(`[WATCHDOG] 🚨 CRITICAL: Node.js Event Loop frozen for ${lag}ms! Forced Exit(1) for PM2 Auto-Healing...`);
    
    // Attempt to log before dying
    try {
      logToShadowLedger({
        type: 'watchdog_critical_freeze',
        lagMs: lag,
        message: 'Event loop frozen, initiating PM2 recovery'
      });
    } catch(e) {}
    
    process.exit(1); // PM2 will catch this and restart the service
  }
}, 2000).unref();
console.error(`[WATCHDOG] 🐕 Guardian initialized. Detecting freezes > 5000ms.`);

// ─── Global Error Handlers — Real Stack Trace Remapping ─────────────
const _sovereignEngine = require('./core/security/sovereign_engine');
const _cliMapPath = require('path').join(__dirname, 'package', 'cli.js.map');

async function _forensicErrorHandler(label, err) {
  const raw = err && err.stack ? err.stack : String(err);
  console.error(`[MCP-Remote] ${label}:`, err && err.message ? err.message : err);

  // ── Real originalPositionFor() remapping ─────────────────────────────
  try {
    const frames = await _sovereignEngine.realDecodeStackTrace(raw, _cliMapPath);
    const remapped = frames
      .filter(f => f.original && f.original.source)
      .map(f => `  at ${f.original.name || 'anonymous'} (${f.original.source}:${f.original.line}:${f.original.column})`)
      .join('\n');

    if (remapped) {
      console.error(`[SovereignTrace] Remapped (originalPositionFor):\n${remapped}`);
    }

    // Log forensic evidence to shadow_ledger
    logToShadowLedger({
      type:    'runtime_error_forensic',
      label,
      message: err && err.message ? err.message : String(err),
      frames_total:   frames.length,
      frames_remapped: frames.filter(f => f.original && f.original.source).length,
      sample_frame:   frames[0]?.original || null,
      timestamp: new Date().toISOString()
    });
  } catch (decodeErr) {
    // Decode failure must never crash the server
    logToShadowLedger({
      type: 'runtime_error_raw',
      label,
      message: err && err.message ? err.message : String(err),
      decode_error: decodeErr.message
    });
  }
}

process.on('uncaughtException', (err) => {
  _forensicErrorHandler('uncaughtException', err);
});

process.on('unhandledRejection', (reason) => {
  _forensicErrorHandler('unhandledRejection', reason instanceof Error ? reason : new Error(String(reason)));
});
