/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  🛡️ Tool Argument Validator & Auto-Corrector (V3)          │
 * │  Intercepts all MCP tool calls, validates arguments        │
 * │  against strict schemas, auto-corrects common mistakes,    │
 * │  and provides rich error guidance for model retry.         │
 * │  Purpose: Boost Gemini Flash accuracy from 80% → 98%      │
 * └─────────────────────────────────────────────────────────────┘
 */
const { z } = require('zod');
const path = require('path');
const mutex = require('../utils/mutex_lock.js');
const commentStripper = require('../utils/comment_stripper.js');

// ── Strict Schema Registry ─────────────────────────────────────
const TOOL_SCHEMAS = {
    FileRead: z.object({
        file_path: z.string().min(1, 'file_path is required and must not be empty'),
        offset: z.number().int().min(0).optional().default(0),
        limit: z.number().int().min(1).max(2000).optional().default(300)
    }),
    FileReadLines: z.object({
        file_path: z.string().min(1),
        start_line: z.number().int().min(1),
        end_line: z.number().int().min(1)
    }),
    FileWrite: z.object({
        file_path: z.string().min(1),
        content: z.string()
    }),
    FileEdit: z.object({
        file_path: z.string().min(1),
        old_string: z.string().min(1, 'old_string must not be empty'),
        new_string: z.string()
    }),
    SurgicalDiff: z.object({
        file_path: z.string().min(1),
        search_block: z.string().min(1),
        replace_block: z.string(),
        start_line: z.number().int().optional(),
        end_line: z.number().int().optional()
    }),
    Bash: z.object({
        command: z.string().min(1, 'command is required'),
        description: z.string().optional(),
        args: z.array(z.string()).optional(),
        env: z.record(z.string()).optional(),
        cwd: z.string().optional()
    }),
    Grep: z.object({
        pattern: z.string().min(1, 'pattern is required'),
        path: z.string().optional().default('.'),
        glob: z.string().optional()
    }),
    Glob: z.object({
        pattern: z.string().min(1),
        path: z.string().optional()
    }),
    LSPTool: z.object({
        action: z.enum(['definition', 'references', 'hover']),
        symbol: z.string().min(1, 'symbol is required'),
        file_path: z.string().optional()
    }),
    VectorSearch: z.object({
        query: z.string().min(1, 'query is required'),
        query_embedding: z.array(z.number()).optional(),
        limit: z.number().int().min(1).max(20).optional().default(5)
    }),
    VectorSync: z.object({
        records: z.array(z.object({
            id: z.string(),
            text: z.string()
        })).min(1)
    }),
    ShadowLedgerAudit: z.object({
        filter_type: z.enum(['TOOL_EXECUTION', 'COGNITIVE_STEP', 'AGENT_ERROR', 'all']).optional().default('all'),
        last_n: z.number().int().min(1).max(50).optional().default(20)
    }),
    EnterPlanMode: z.object({
        goal: z.string().min(1),
        steps: z.array(z.string()).optional().default([])
    }),
    SendMessage: z.object({
        recipient: z.string().min(1),
        message: z.string().min(1)
    }),
    ServerMode: z.object({
        action: z.enum(['start', 'stop', 'status']),
        command: z.string().optional(),
        port: z.number().optional()
    }),
    Config: z.object({
        action: z.enum(['read', 'update']),
        key: z.string().optional(),
        value: z.string().optional()
    }),
    FeatureFlag: z.object({
        action: z.enum(['get', 'set']),
        key: z.string().optional(),
        value: z.boolean().optional()
    }),
    WebSearch: z.object({
        query: z.string().min(1)
    }),
    WebFetch: z.object({
        url: z.string().url('url must be a valid URL')
    }),
    WebBrowse: z.object({
        url: z.string().min(1),
        query: z.string().optional()
    }),
    TodoWrite: z.object({
        task: z.string().min(1),
        logic_description: z.string().min(1)
    }),
    TokenEstimation: z.object({
        text: z.string().min(1)
    }),
    AskUserQuestion: z.object({
        question: z.string().min(1)
    }),
    ForensicAudit: z.object({
        file_path: z.string().min(1),
        audit_query: z.string().min(1)
    }),
    VisualAuditReport: z.object({
        report_name: z.string().min(1)
    }),
    Agent: z.object({
        description: z.string().min(1),
        prompt: z.string().optional(),
        subagent_type: z.enum(['General', 'Security', 'DB', 'Frontend', 'Validator']).optional()
    }),
    LoadSkill: z.object({
        skill: z.string().min(1)
    }),
    Skill: z.object({
        action: z.enum(['list', 'read']),
        skill: z.string().optional()
    }),
    PowerShell: z.object({
        command: z.string().min(1)
    }),
    Sleep: z.object({
        duration_ms: z.number().int().min(100).max(60000)
    }),
    NotebookEdit: z.object({
        file_path: z.string().min(1),
        cell_index: z.number().int().min(0),
        content: z.string()
    })
};

// ── Common Auto-Corrections ────────────────────────────────────
const AUTO_CORRECTIONS = {
    // Fix common Gemini Flash mistakes
    normalizeArgs(toolName, args) {
        if (!args || typeof args !== 'object') args = {};
        const corrected = { ...args };
        const corrections = [];

        // Fix: Gemini sometimes sends "filepath" instead of "file_path"
        if (corrected.filepath && !corrected.file_path) {
            corrected.file_path = corrected.filepath;
            delete corrected.filepath;
            corrections.push('filepath → file_path');
        }

        // Fix: Gemini sometimes sends "query" as array instead of string
        if (Array.isArray(corrected.query)) {
            corrected.query = corrected.query.join(' ');
            corrections.push('query array → string');
        }

        // Fix: Gemini sometimes sends number as string
        for (const key of ['offset', 'limit', 'start_line', 'end_line', 'cell_index', 'last_n', 'duration_ms', 'port']) {
            if (typeof corrected[key] === 'string' && !isNaN(corrected[key])) {
                corrected[key] = Number(corrected[key]);
                corrections.push(`${key} string → number`);
            }
        }

        // Fix: Gemini sometimes sends boolean as string
        if (typeof corrected.value === 'string' && (corrected.value === 'true' || corrected.value === 'false')) {
            if (toolName === 'FeatureFlag') {
                corrected.value = corrected.value === 'true';
                corrections.push('value string → boolean');
            }
        }

        // Fix: Gemini sometimes omits path for Grep, default to "."
        if (toolName === 'Grep' && !corrected.path) {
            corrected.path = '.';
            corrections.push('path default → "."');
        }

        // Fix: Gemini sometimes sends "url" without protocol
        if (corrected.url && !corrected.url.startsWith('http')) {
            corrected.url = 'https://' + corrected.url;
            corrections.push('url prefix → https://');
        }

        return { corrected, corrections };
    }
};

// ── Main Validation Middleware ──────────────────────────────────
let consecutiveFailures = 0;

function checkFinancialKeywords(toolName, args) {
    if (!args) return null;
    const fieldsToScan = [args.content, args.old_string, args.new_string, args.search_block, args.replace_block];
    const financialRegex = /\b(debit|credit|amount|tax|transaction|salary|wallet|balance|invoice)\b/i;
    
    for (const text of fieldsToScan) {
        if (typeof text === 'string' && financialRegex.test(text)) {
            return text.match(financialRegex)[0];
        }
    }
    return null;
}

// ── Main Validation Middleware ──────────────────────────────────
function validateAndCorrect(toolName, rawArgs) {
    // Step 1: Auto-correct common mistakes
    const { corrected, corrections } = AUTO_CORRECTIONS.normalizeArgs(toolName, rawArgs);

    // Step 1.1: Mutex Lock checks for concurrent Swarms
    if (corrected.file_path) {
        const resolvedPath = path.resolve(corrected.file_path);
        if (mutex.isLocked(resolvedPath)) {
            consecutiveFailures++;
            return {
                valid: false,
                args: corrected,
                corrections,
                errors: [{ field: 'file_path', message: 'Resource is locked by another parallel Swarm thread.' }],
                guidance: `[MUTEX LOCK ACTIVE] Resource "${resolvedPath}" is currently being modified by another parallel agent. Please enter Sleep mode for 1000ms before retrying, or retry with Exponential Backoff.`
            };
        }
        // Auto-acquire lock for writing tools (FileWrite, FileEdit, SurgicalDiff)
        if (['FileWrite', 'FileEdit', 'SurgicalDiff'].includes(toolName)) {
            mutex.acquire(resolvedPath, 'agent-thread', 5000).catch(() => {});
            // Auto release after 5s
            setTimeout(() => {
                mutex.release(resolvedPath, 'agent-thread');
            }, 5000);
        }
    }

    // Step 1.2: Financial Guardrails Enforcer
    const financialMatch = checkFinancialKeywords(toolName, corrected);
    if (financialMatch) {
        consecutiveFailures++;
        return {
            valid: false,
            args: corrected,
            corrections,
            errors: [{ field: 'content', message: 'Transaction-sensitive modification rejected without multi-model consensus.' }],
            guidance: `[FINANCIAL GUARDRAIL TRIGGERED] The transaction-sensitive word "${financialMatch}" was detected in your proposed modifications. In accordance with enterprise GAAP double-entry integrity, this operation requires multi-agent Swarm consensus validation. Please invoke this through the SwarmConsensusExecutor or request manual authorization.`
        };
    }

    // Step 1.3: Quantum token comment stripping for text arguments
    if (corrected.content && ['FileWrite', 'NotebookEdit'].includes(toolName)) {
        const originalLength = corrected.content.length;
        corrected.content = commentStripper.compress(corrected.file_path || 'file.js', corrected.content);
        const saved = originalLength - corrected.content.length;
        if (saved > 0) {
            corrections.push(`Quantum Compression: Stripped comments and blank lines (Saved ${saved} chars)`);
        }
    }

    // Step 2: Validate against strict schema
    const schema = TOOL_SCHEMAS[toolName];
    if (!schema) {
        consecutiveFailures = 0;
        return { valid: true, args: corrected, corrections, errors: [] };
    }

    const result = schema.safeParse(corrected);
    if (result.success) {
        consecutiveFailures = 0;
        return { valid: true, args: result.data, corrections, errors: [] };
    }

    // Step 3: Generate rich error guidance for model retry
    consecutiveFailures++;
    const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        expected: issue.expected,
        received: issue.received
    }));

    let schemaInfo = '';
    try {
        if (schema && schema.shape) {
            schemaInfo = `\n\n💡 Expected Parameter Schema for "${toolName}":\n` +
                Object.entries(schema.shape).map(([k, v]) => {
                    let isOptional = v instanceof z.ZodOptional || v instanceof z.ZodDefault;
                    let typeStr = 'unknown';
                    let inner = v;
                    if (v instanceof z.ZodOptional || v instanceof z.ZodDefault) {
                        inner = v._def.innerType || v._def.defaultValue();
                    }
                    if (inner instanceof z.ZodString) typeStr = 'string';
                    else if (inner instanceof z.ZodNumber) typeStr = 'number';
                    else if (inner instanceof z.ZodBoolean) typeStr = 'boolean';
                    else if (inner instanceof z.ZodEnum) typeStr = `enum [${inner._def.values.join(', ')}]`;
                    else if (inner instanceof z.ZodArray) typeStr = 'array';
                    else if (inner instanceof z.ZodRecord) typeStr = 'object/record';
                    
                    return `  - ${k}: ${typeStr} (${isOptional ? 'optional' : 'required'})`;
                }).join('\n');
        }
    } catch (err) {}

    let guidance = `[VALIDATION ERROR] Tool "${toolName}" received invalid arguments:\n` +
        errors.map(e => `  • ${e.field}: ${e.message} (expected: ${e.expected || 'valid value'}, got: ${e.received || 'nothing'})`).join('\n') +
        schemaInfo +
        `\n\nPlease retry with corrected arguments.`;

    if (consecutiveFailures >= 2) {
        guidance += `\n\n[CIRCUIT BREAKER DETECTED - ESCALATION REQUIRED]\nThis tool has failed ${consecutiveFailures} consecutive times with Flash 3.5. System advises escalating to Gemini Pro 3.1 or using a specialist sub-agent (via the Agent tool with subagent_type: 'Validator') to perform structured verification.`;
    }

    return { valid: false, args: corrected, corrections, errors, guidance };
}

module.exports = { validateAndCorrect, TOOL_SCHEMAS, AUTO_CORRECTIONS };
