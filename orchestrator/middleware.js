/**
 * Orchestrator Middleware (Interceptor)
 * -------------------------------------------------
 * This middleware is inserted once (e.g., in the Bridge initialization)
 * and intercepts every incoming request to the system.
 *
 * Responsibilities:
 *   1. Generate a correlation ID for the request.
 *   2. Validate the request against the decision matrix (ISO‑27001 & GAAP).
 *   3. Publish the event (request + validation result) to Redis Pub/Sub
 *      on channel `mcp:messages` so all Swarms/agents receive it.
 *   4. Attach the correlation ID and validation outcome to the request
 *      object for downstream handlers.
 *
 * NOTE: No `node-event-emitter` is used – Redis is the sole event bus.
 */

const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// ─── Cognitive State Tracking (Reasoning Engine) ──────────────
const cognitiveStateMap = new Map(); // key: user.username, value: timestamp of last reasoning
const DESTRUCTIVE_TOOLS = ['Bash', 'PowerShell', 'FileWrite', 'SurgicalDiff', 'MultiReplaceFileContent'];
const REASONING_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes validity

// Create a Redis client (assumes default host/port – adjust via env if needed)
const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3;
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  retryStrategy: (times) => {
    if (times > maxRetries) {
      console.warn('⚠️ Redis connection attempts stopped to prevent log spam.');
      return null; // Stop retrying after 3 attempts
    }
    return Math.min(times * 50, 2000);
  }
});
// Graceful handling of Redis connection errors – do not let them crash the process
redisClient.connect().catch(err => { console.warn('⚠️ Redis connection error (non‑fatal):', err.message); });
// Silently ignore runtime Redis errors
redisClient.on('error', (err) => { console.warn('⚠️ Redis runtime error (ignored):', err.message); });

// Load decision matrix (markdown) – simple parser for demo purposes
const decisionMatrixPath = path.resolve(__dirname, 'policy', 'decision_matrix.md');
let decisionMatrixContent = '';
try {
  decisionMatrixContent = fs.readFileSync(decisionMatrixPath, 'utf8');
} catch (e) {
  console.warn('⚠️ Could not read decision matrix:', e.message);
}

/**
 * Policy & Cognitive Check
 * Returns {allowed: boolean, level: number, reasons: string[]}
 */
function evaluatePolicy(request) {
  const reasons = [];
  const toolName = request.body && request.body.name ? request.body.name : null;
  const username = request.user ? request.user.username : 'system';

  // 1. Reasoning Engine Enforcer (Cognitive Check)
  if (toolName === 'ReasoningEngine') {
    const args = request.body && request.body.arguments ? request.body.arguments : {};
    const analysis = (args.analysis || '').toLowerCase();
    
    // Strict Structural Check for Gemini Supremacy:
    const hasAnalysis = analysis.includes('analysis') || analysis.includes('التحليل');
    const hasImpact = analysis.includes('impact') || analysis.includes('التأثير');
    const hasDecision = analysis.includes('decision') || analysis.includes('القرار') || analysis.includes('conclusion');
    
    if (analysis.length >= 50 && hasAnalysis && hasImpact && hasDecision) {
      // Record that the agent has explicitly reasoned (unlock destructive tools)
      cognitiveStateMap.set(username, Date.now());
    }
    // ALWAYS allow the ReasoningEngine tool itself to execute, so it can return structured validation/warning/status to the caller
    return { allowed: true, level: 1, reasons: [] };
  } else if (DESTRUCTIVE_TOOLS.includes(toolName)) {
    const lastReasoning = cognitiveStateMap.get(username);
    if (!lastReasoning || (Date.now() - lastReasoning > REASONING_EXPIRY_MS)) {
      reasons.push(`[Cognitive Lock] MANDATORY: You must call the 'ReasoningEngine' tool to analyze and deliberate before calling destructive tool '${toolName}'.`);
      return { allowed: false, level: 3, reasons };
    }
  }

  // 1.5. Quantum Memory / Token Optimization Enforcer (Anti-Opus Guard)
  // NOTE: Admin users are exempt — they need full file access for oversight tasks.
  if (toolName === 'FileRead' || toolName === 'view_file') {
    const isAdmin = request.user && request.user.role === 'Admin';
    if (!isAdmin) {
      const args = request.body && request.body.arguments ? request.body.arguments : {};
      const limit = args.limit || 0;
      if (!limit || limit > 500) {
        reasons.push(`[Quantum Guard] MANDATORY: Direct reads over 500 lines are BLOCKED to prevent context overflow. You MUST spawn a sub-agent using the 'Agent' tool to summarize this file, or use 'QuantumTokenCompressor'.`);
        return { allowed: false, level: 3, reasons };
      }
    }
  }

  // 2. Budget / Level Checks
  const levelMap = { operation: 1, technical: 2, financial: 3, strategic: 4 };
  const category = request.headers && request.headers['x-request-category'] ? request.headers['x-request-category'] : 'operation';
  const level = levelMap[category] || 1;
  const allowed = level <= 2; 

  if (!allowed) {
    reasons.push(`Level ${level} requires higher‑level approvals (Finance/Executive).`);
  }
  
  if (request.body && request.body.arguments && request.body.arguments.budget && request.body.arguments.budget > 10000) {
    reasons.push('Budget exceeds allowed limit (10,000).');
    return { allowed: false, level, reasons };
  }
  return { allowed: reasons.length === 0, level, reasons };
}

/**
 * The exported middleware function. It follows the common (req, res, next) signature.
 */
async function orchestratorMiddleware(req, res, next) {
  try {
    const correlationId = uuidv4();
    req.correlationId = correlationId;

    const policyResult = evaluatePolicy(req);
    req.orchestrator = { policy: policyResult, correlationId };

    // Publish the event to Redis (always publish, even on failure)
    const event = {
      timestamp: new Date().toISOString(),
      correlationId,
      request: {
        path: req.path,
        method: req.method,
        user: req.user ? req.user.username : undefined,
        project: req.project ? req.project.id : undefined,
        category: req.headers['x-request-category'] || 'operation',
        arguments: req.body ? req.body.arguments : {}
      },
      result: policyResult.allowed ? 'allowed' : 'rejected',
      reasons: policyResult.reasons
    };
    try {
        await redisClient.publish('mcp:messages', JSON.stringify(event));
      } catch (pubErr) {
        console.warn('⚠️ Redis publish failed (ignored):', pubErr.message);
      }

function getAlternativesForPolicy(toolName, reasons) {
  const alternatives = [];
  if (DESTRUCTIVE_TOOLS.includes(toolName)) {
    alternatives.push("Call the 'ReasoningEngine' tool to analyze and deliberate before calling destructive tool.");
    alternatives.push("Use non-destructive alternatives like 'view_file' (within limits) or 'grep_search'.");
  }
  if (reasons.some(r => r.includes('[Cognitive Lock] MANDATORY: Your reasoning must be structured'))) {
    alternatives.push("Provide arguments with 'analysis', 'impact', and 'decision' keywords (or their Arabic equivalents: 'التحليل', 'التأثير', 'القرار').");
    alternatives.push("Ensure the analysis field is a structured markdown string of at least 50 characters.");
  }
  if (toolName === 'FileRead' || toolName === 'view_file') {
    alternatives.push("Specify 'limit' (less than 500 lines) or 'StartLine' and 'EndLine' to restrict the read range.");
    alternatives.push("Use 'QuantumTokenCompressor' or spawn a sub-agent to summarize large files.");
  }
  if (reasons.some(r => r.includes('requires higher‑level approvals') || r.includes('exceeds allowed limit'))) {
    alternatives.push("Request budget approval or use partial/lower-budget parameters.");
    alternatives.push("Log as strategic tasks through 'TodoWrite' for executive sign-off.");
  }
  return alternatives;
}

    if (!policyResult.allowed) {
      const toolName = req.body && req.body.name ? req.body.name : 'unknown';
      // Log rejection to shadow ledger
      try {
        const ledgerPath = path.resolve(__dirname, '..', '.agents', 'memory', 'shadow_ledger.jsonl');
        const record = {
          timestamp: new Date().toISOString(),
          source: 'MCP_REMOTE_SERVER',
          type: 'mcp_remote_tool_execution',
          tool: toolName,
          status: 'REJECTED',
          error: 'Policy violation – ' + policyResult.reasons.join('; '),
          user: req.user ? req.user.username : undefined,
          project: req.project ? req.project.id : undefined,
          correlationId
        };
        const line = JSON.stringify(record) + '\n';
        require('fs').appendFileSync(ledgerPath, line);
      } catch (logErr) {
        console.error('Failed to write rejection to shadow ledger:', logErr);
      }

      // Reject the request early – respond with 403 and include reasons & alternatives
      res.status(403).json({
        error: 'Policy violation',
        reasons: policyResult.reasons,
        alternatives: getAlternativesForPolicy(toolName, policyResult.reasons),
        correlationId
      });
      return; // stop further processing
    }

    next();
  } catch (err) {
    console.error('Orchestrator middleware error:', err);
    // Fail‑safe: allow request to continue but log the error via Redis
    try {
        await redisClient.publish('mcp:messages', JSON.stringify({
          timestamp: new Date().toISOString(),
          error: err.message,
          correlationId: req?.correlationId || 'unknown'
        }));
    } catch (pubErr) {
        console.warn('⚠️ Redis publish failed (ignored):', pubErr.message);
    }
    next();
  }
}

async function runOrchestratorPolicy({ toolName, args, user, project }) {
  const req = {
    body: { name: toolName, arguments: args },
    user,
    project,
    headers: {}
  };
  const result = evaluatePolicy(req);
  return {
    allowed: result.allowed,
    rejectMessage: result.reasons.join('; ')
  };
}

module.exports = {
  orchestratorMiddleware,
  runOrchestratorPolicy
};
