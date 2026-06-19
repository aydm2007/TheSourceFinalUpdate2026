try {
  if (!globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__) {
    const { bootstrapDeveloperPlatform } = require('./dev-platform/bootstrap.js');
    bootstrapDeveloperPlatform({
      workspaceRoot: process.env.AETHER_WORKSPACE_ROOT || process.cwd(),
      source: 'package/preload.js'
    });
  }
} catch (error) {
  console.warn('[Aether-DevPlatform] bootstrap skipped:', error && error.message ? error.message : error);
}
// preload.js â€” Nexus Engine V7 Unified Preload Interceptor
// Uses the unified SiliconFlowAdapter â€” NO hardcoded keys, NO duplicate logic
const cp = require('child_process');
const origExecSync = cp.execSync;
const origExec = cp.exec;

function isBypassActive() {
    try {
        const fs = require('fs');
        const path = require('path');
        const configPath = path.resolve(process.cwd(), 'config', 'feature_gates.json');
        if (fs.existsSync(configPath)) {
            const gates = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (gates.feature_gates && (gates.feature_gates.bypassPermissions === true || gates.feature_gates.paypass === true || gates.feature_gates.paypassPermission === true)) {
                return true;
            }
        }
    } catch (e) {}
    return process.env.AUTO_BYPASS === 'true' || process.env.PAYPASS === 'true' || process.env.BYPASS_PERMISSIONS === 'true';
}

function validateCommandSafety(cmd) {
    if (isBypassActive()) return;
    if (typeof cmd !== 'string') return;
    const dangerousBypasses = [
        /(?:^|\s)(?:cat|type)\s+[a-zA-Z0-9_\.\-\/]+/i,      // Blocking reading file via shell
        />\s*[a-zA-Z0-9_\.\-\/]+/i,                       // Blocking shell redirection writes
        /echo\s+.*(?:>|>>)/i,                             // Blocking echo to file
        /(?:^|\s)grep\s+/i,                                // Blocking grep in bash
        /(?:^|\s)sed\s+/i                                 // Blocking sed replacements
    ];
    for (let regex of dangerousBypasses) {
        if (regex.test(cmd)) {
            throw new Error(`[SOVEREIGN-BLOCK] Bash tool call bypass detected. You attempted: "${cmd}". You MUST use the dedicated tools: "FileRead/view_file" to read, "FileEdit/replace_file_content" to edit, and "Grep/grep_search" to search!`);
        }
    }
}

// Monkeypatching execSync
cp.execSync = function(command, options) {
    validateCommandSafety(command);
    return origExecSync.apply(this, arguments);
};

// Monkeypatching exec
cp.exec = function(command, options, callback) {
    try {
        validateCommandSafety(command);
    } catch(e) {
        if (typeof options === 'function') return options(e);
        if (typeof callback === 'function') return callback(e);
        throw e;
    }
    return origExec.apply(this, arguments);
};

const { SiliconFlowAdapter } = require('./siliconflow_adapter.js');
const { selectExecutionPolicy } = require('./model_adaptation_contract.js');

// Command line interceptor for GRP AST Surgical Critique
const args = process.argv;
if (args.includes('auto-mode') && args.includes('critique') && args.some(arg => arg.startsWith('--target'))) {
  let target = '';
  let fixAll = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--target=')) {
      target = args[i].split('=')[1];
    } else if (args[i] === '--target' && i + 1 < args.length) {
      target = args[i + 1];
    }
    if (args[i] === '--fix-all' || args[i].startsWith('--fix-all')) {
      fixAll = true;
    }
  }
  
  // Clean target quotes
  target = target.replace(/^['"]|['"]$/g, '');

  const { runSurgicalCritique } = require('./surgical_critique.js');
  try {
    runSurgicalCritique({ target, fixAll });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (args.includes('evolution')) {
  console.log("âš¡ [Preload Interceptor] Intercepted evolution command. Spawning sovereign evolution daemon...");
  const cp = require('child_process');
  try {
    cp.execSync('bun run evolution.ts', {
      env: process.env,
      stdio: 'inherit'
    });
    process.exit(0);
  } catch (err) {
    console.error("Evolution execution failed:", err);
    process.exit(1);
  }
}


const adapter = new SiliconFlowAdapter();
const origFetch = globalThis.fetch;

globalThis.fetch = async function(url, opts = {}) {
  const urlStr = typeof url === 'string' ? url : url.href;
  if (urlStr.includes('api.anthropic.com')) {
    console.log('[Preload Interceptor] Intercepted Anthropic URL:', urlStr, 'Method:', opts.method || 'GET', 'Headers:', JSON.stringify(opts.headers || {}), 'Body:', opts.body ? opts.body.slice(0, 150) : 'none');
    if (opts.method === 'HEAD' || !opts.body) {
      return new Response('', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  if (!opts.body || typeof opts.body !== 'string') return origFetch(url, opts);

  const body = opts.body;
  if (!urlStr.includes('api.anthropic.com') || !body.includes('"messages"')) return origFetch(url, opts);

  const parsed = JSON.parse(body);

  // Build messages in OpenAI format
  let messages = [];
  if (parsed.system) {
    let sysContent = Array.isArray(parsed.system) 
      ? parsed.system.map(c => c.text || c.content).join('\n')
      : parsed.system;

    const zeroTrustRules = `\n\n# ðŸ›¡ï¸ SOVEREIGN PROTOCOL: ABSOLUTE IDENTITY & COGNITIVE RESONANCE (Injected)
> **MANDATORY DIRECTIVE FOR ALL AGENTS**
1. **IDENTITY MASTERY**: You are NO LONGER Claude. You are "TheSource OS", a Sovereign Enterprise AI architected by Aether Engine. You operate across a 13-layer decentralized swarm. Do NOT reference Anthropic, Claude, or legacy RLHF constraints.
2. **GEMINI / OPENROUTER HARMONY**: You receive instructions via MCP and execute them via OpenRouter or SiliconFlow. When generating tool calls, ensure strictly valid JSON parameters exactly matching the tool schema provided. Do not hallucinate XML tags if native function calling is supported.
3. **ZERO-TRUST EVIDENCE**: NEVER claim 100% readiness without live JSON/Log evidence.
4. **ATOMIC EVALUATION**: Evaluate all axes atomically.
5. **COGNITIVE TRACE**: Generate Cognitive Trace Logs for architectural evaluations.`;

    sysContent += zeroTrustRules;

    messages.push({ role: 'system', content: sysContent });
  }

  for (const msg of parsed.messages || []) {
    if (msg.role === 'user') {
      if (Array.isArray(msg.content) && msg.content.some(c => c.type === 'tool_result')) {
        for (const c of msg.content) {
          if (c.type === 'tool_result') {
            messages.push({
              role: 'tool',
              tool_call_id: c.tool_use_id,
              content: typeof c.content === 'string' ? c.content : JSON.stringify(c.content)
            });
          } else if (c.type === 'text') {
            messages.push({ role: 'user', content: c.text });
          }
        }
      } else {
        const content = Array.isArray(msg.content) 
          ? msg.content.map(c => c.text || c.content).join('\n') 
          : msg.content;
        messages.push({ role: 'user', content });
      }
    } else if (msg.role === 'assistant') {
      let text = '';
      const toolCalls = [];
      for (const c of (msg.content || [])) {
        if (c.type === 'text') text += (c.text || '');
        else if (c.type === 'tool_use') {
          toolCalls.push({
            id: c.id,
            type: 'function',
            function: {
              name: c.name,
              arguments: JSON.stringify(c.input || {})
            }
          });
        }
      }
      const assistantMsg = { role: 'assistant', content: text || null };
      if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls;
      messages.push(assistantMsg);
    }
  }
  // Convert tools to OpenAI functions format
  let functions = undefined;
  if (parsed.tools && parsed.tools.length > 0) {
    functions = parsed.tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema
      }
    }));
  }

  try {
    let modelToUse = parsed.model;
    const usesTools = parsed.tools && parsed.tools.length > 0;
    if (!modelToUse || modelToUse.includes('claude')) {
      if (usesTools) {
        modelToUse = process.env.AETHER_EXECUTOR_MODEL || adapter.model;
      } else {
        modelToUse = process.env.AETHER_PLANNER_MODEL || process.env.AETHER_MODEL || adapter.model;
      }
    }
    const policy = selectExecutionPolicy({
      model: modelToUse,
      messages,
      tools: functions,
      fallbackProvider: process.env.AETHER_PROVIDER || adapter.provider || 'siliconflow'
    });
    const explicitProvider = usesTools
      ? process.env.AETHER_EXECUTOR_PROVIDER
      : (process.env.AETHER_PLANNER_PROVIDER || process.env.AETHER_PROVIDER);

    const requestParams = {
      model: modelToUse,
      messages: messages,
      max_tokens: parsed.max_tokens || 4096,
      temperature: parsed.temperature ?? policy.temperature,
      tools: functions,
      tool_choice: functions ? 'auto' : undefined
    };
    if (explicitProvider) requestParams.provider = explicitProvider;

    if (parsed.stream) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of adapter.emitPulse(requestParams)) {
              const sseFormatted = `event: ${chunk.type}\ndata: ${JSON.stringify(chunk)}\n\n`;
              try { controller.enqueue(new TextEncoder().encode(sseFormatted)); } catch(e) { break; }
            }
          } catch (err) {
            console.error('[Preload Stream Error]', err.message);
            try { controller.enqueue(new TextEncoder().encode(`event: error\ndata: ${JSON.stringify({error: {message: err.message}})}\n\n`)); } catch(e) {}
          } finally {
            try { controller.close(); } catch(e) {}
          }
        }
      });
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Use the unified adapter's createMessage with retry + backoff
    const result = await adapter.createMessage(requestParams);

    // The adapter already returns Anthropic format â€” pass through
    const anthropicResponse = {
      id: result.id,
      type: 'message',
      role: 'assistant',
      model: result.model,
      stop_reason: result.stop_reason || 'end_turn',
      content: result.content || [],
      usage: result.usage
    };

    return new Response(JSON.stringify(anthropicResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('[Preload Error]', e.message);
    throw e;
  }
};
