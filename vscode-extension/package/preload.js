// preload.js — Nexus Engine V7 Unified Preload Interceptor
// Uses the unified SiliconFlowAdapter — NO hardcoded keys, NO duplicate logic
const { SiliconFlowAdapter } = require('./siliconflow_adapter.js');

const args = process.argv;
if (args.includes('evolution')) {
  console.log("⚡ [Preload Interceptor] Intercepted evolution command in extension. Spawning sovereign evolution daemon...");
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

globalThis.fetch = async function(url, opts) {
  const urlStr = typeof url === 'string' ? url : url.href;
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

    const zeroTrustRules = `\n\n# 🛡️ SOVEREIGN PROTOCOL: ZERO-TRUST & ATOMIC REPORTING (Injected)
> **MANDATORY DIRECTIVE FOR ALL AGENTS**
1. **ZERO-TRUST EVIDENCE**: NEVER claim 100% readiness or evaluate a system based solely on Markdown documentation. You MUST fetch and read the live JSON evidence (e.g., \`summary.json\` or runtime logs) before issuing a final verdict.
2. **ATOMIC EVALUATION**: When asked to evaluate multiple modules or axes, you MUST evaluate each one atomically. DO NOT aggregate or group them to hide details.
3. **COGNITIVE TRACE**: For any complex architectural evaluation, you MUST generate a Cognitive Trace Log to document your assumptions and decision matrix.`;

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
    if (!modelToUse || modelToUse.includes('claude')) {
      if (parsed.tools && parsed.tools.length > 0) {
        modelToUse = process.env.AETHER_EXECUTOR_MODEL || 'deepseek-ai/DeepSeek-V3';
      } else {
        modelToUse = process.env.AETHER_PLANNER_MODEL || process.env.AETHER_MODEL || 'deepseek-ai/DeepSeek-V3';
      }
    }

    // Use the unified adapter's createMessage with retry + backoff
    const result = await adapter.createMessage({
      model: modelToUse,
      messages: messages,
      max_tokens: parsed.max_tokens || 4096,
      temperature: parsed.temperature || 0.7,
      tools: functions,
      tool_choice: functions ? 'auto' : undefined
    });

    // The adapter already returns Anthropic format — pass through
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
