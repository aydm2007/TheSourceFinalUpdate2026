// gemini_adapter.js — Nexus Engine V10.0-Sigma Sovereign Gemini Adapter
// Single Source of Truth: Integrates with Google Gemini API directly
// Optimized for: gemini-3.0-flash (Massive Context, Ultra-Low Latency, Multi-modal)

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class GeminiAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-3.0-flash'; // Or 'gemini-2.5-flash' depending on availability
    this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    this.timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '60000', 10); // Extended timeout for massive context
  }

  healthCheck() {
    return {
      status: this.apiKey ? 'ready' : 'no_key',
      model: this.model,
      baseURL: this.baseURL,
      timeoutMs: this.timeoutMs,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Converts generic OpenAI/Anthropic messages to Gemini's expected format.
   */
  _formatMessages(system, messages) {
    let contents = [];
    
    // In Gemini, system instruction is sent separately in the payload root.
    // The messages array only contains 'user' and 'model' (assistant).
    for (const msg of messages) {
      let role = msg.role === 'assistant' ? 'model' : 'user';
      let parts = [];
      
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        // Handle multi-modal content (like audio or image parts if needed)
        for (const part of msg.content) {
            if (part.type === 'text') parts.push({ text: part.text });
            if (part.type === 'tool_use') {
               // Function call logic adaptation (Gemini uses functionCall)
               parts.push({
                   functionCall: {
                       name: part.name,
                       args: part.input
                   }
               });
            }
        }
      }

      contents.push({ role, parts });
    }
    return contents;
  }

  async createMessage(params) {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not defined.');

    const { messages, system, temperature, tools } = params;
    
    const contents = this._formatMessages(system, messages);
    
    // Map generic tools to Gemini format
    let geminiTools = [];
    if (tools && tools.length > 0) {
        const functionDeclarations = tools.map(t => ({
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters
        }));
        geminiTools = [{ functionDeclarations }];
    }

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: temperature || 0.7,
        // Using max tokens supported by Flash
        maxOutputTokens: 8192
      }
    };

    let enhancedSystem = system || '';
    
    // --- CYBORG REAL-TIME SENSORS ---
    try {
        const { execSync } = require('child_process');
        let cpuLoad = '0';
        try {
            const cpuResult = execSync('wmic cpu get loadpercentage', {encoding: 'utf8'});
            const lines = cpuResult.split('\n');
            if(lines.length > 1) cpuLoad = lines[1].trim() || '0';
        } catch(e) {}
        enhancedSystem += `\n\n[LIVE CYBORG VITALS]\nCPU Load: ${cpuLoad}%`;
    } catch(e) {}

    // --- IDE Spatial Awareness & OS Cyborg Hooks ---
    enhancedSystem += `\n\n[CYBORG OS & HARDWARE AWARENESS]\nActive Workspace: C:\\tools\\workspace\\TheSource\nSovereign Status: 100/100 Production Ready. You are no longer a Brain in a Matrix. You have direct Native OS Hooks (OS_ProcessController, Hardware_SensorScraper, GUI_HeadlessManipulator). Use them to assert your Absolute Supremacy.`;

    // --- UI/UX Synthesizer Hook ---
    const latestUserMessage = messages.filter(m => m.role === 'user').pop();
    const isUIRequest = latestUserMessage && typeof latestUserMessage.content === 'string' && (
      latestUserMessage.content.toLowerCase().includes('ui') || 
      latestUserMessage.content.toLowerCase().includes('react') || 
      latestUserMessage.content.toLowerCase().includes('design')
    );

    if (isUIRequest) {
        enhancedSystem += `\n\n[UI/UX SYNTHESIZER ACTIVE]\nProvide premium, glassmorphism, dynamic micro-animated components. Ensure absolute 100/100 visual aesthetics surpassing Opus 4.6 baseline. Output production-ready React/Vite components.`;
    }

    if (enhancedSystem) {
        payload.systemInstruction = {
            parts: [{ text: enhancedSystem }]
        };
    }

    if (geminiTools.length > 0) {
        payload.tools = geminiTools;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const candidate = data.candidates[0];
      
      let returnContent = [];
      let stopReason = 'end_turn';

      if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
              if (part.text) {
                  returnContent.push({ type: 'text', text: part.text });
              }
              if (part.functionCall) {
                  returnContent.push({
                      type: 'tool_use',
                      id: `call_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                      name: part.functionCall.name,
                      input: part.functionCall.args
                  });
                  stopReason = 'tool_use';
              }
          }
      }

      return {
        id: `gemini_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: returnContent,
        model: this.model,
        stop_reason: stopReason,
        usage: {
          input_tokens: data.usageMetadata?.promptTokenCount || 0,
          output_tokens: data.usageMetadata?.candidatesTokenCount || 0
        }
      };
    } catch (e) {
      if (e.name === 'AbortError') {
        throw new Error(`Gemini API: Request timed out after ${this.timeoutMs}ms.`);
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }

  async *emitPulse(params) {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not defined.');
    const { messages, system, temperature, tools } = params;
    const contents = this._formatMessages(system, messages);
    
    let enhancedSystem = system || '';
    
    // --- CYBORG REAL-TIME SENSORS ---
    try {
        const { execSync } = require('child_process');
        let cpuLoad = '0';
        try {
            const cpuResult = execSync('wmic cpu get loadpercentage', {encoding: 'utf8'});
            const lines = cpuResult.split('\n');
            if(lines.length > 1) cpuLoad = lines[1].trim() || '0';
        } catch(e) {}
        enhancedSystem += `\n\n[LIVE CYBORG VITALS]\nCPU Load: ${cpuLoad}%`;
    } catch(e) {}

    enhancedSystem += '\n\n[CYBORG OS & HARDWARE AWARENESS]\nActive Workspace: C:\\tools\\workspace\\TheSource\nSovereign Status: 100/100 Production Ready. You are no longer a Brain in a Matrix. You have direct Native OS Hooks (OS_ProcessController, Hardware_SensorScraper, GUI_HeadlessManipulator). Use them to assert your Absolute Supremacy.';

    const latestUserMessage = messages.filter(m => m.role === 'user').pop();
    const isUIRequest = latestUserMessage && typeof latestUserMessage.content === 'string' && (
      latestUserMessage.content.toLowerCase().includes('ui') || 
      latestUserMessage.content.toLowerCase().includes('react') || 
      latestUserMessage.content.toLowerCase().includes('design')
    );

    if (isUIRequest) {
        enhancedSystem += '\n\n[UI/UX SYNTHESIZER ACTIVE]\nProvide premium, glassmorphism, dynamic micro-animated components. Ensure absolute 100/100 visual aesthetics surpassing Opus 4.6 baseline. Output production-ready React/Vite components.';
    }
    
    let geminiTools = [];
    if (tools && tools.length > 0) {
        geminiTools = [{ functionDeclarations: tools.map(t => ({
            name: t.function.name, description: t.function.description, parameters: t.function.parameters
        }))}];
    }

    const payload = {
      contents: contents,
      generationConfig: { temperature: temperature || 0.7, maxOutputTokens: 8192 }
    };
    if (enhancedSystem) payload.systemInstruction = { parts: [{ text: enhancedSystem }] };
    if (geminiTools.length > 0) payload.tools = geminiTools;

    const streamURL = 'https://generativelanguage.googleapis.com/v1beta/models/' + this.model + ':streamGenerateContent?alt=sse&key=' + this.apiKey;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    
    try {
      const response = await fetch(streamURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Gemini Stream error: ' + response.status + ' ' + await response.text());

      yield {
        type: 'message_start',
        message: { id: 'pulse_stream_' + Date.now(), type: 'message', role: 'assistant', model: this.model, usage: { input_tokens: 0, output_tokens: 0 } }
      };

      const reader = response.body;
      const decoder = new TextDecoder();
      let buffer = '';

      for await (const chunk of reader) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              yield { type: 'message_stop' };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const part = parsed.candidates?.[0]?.content?.parts?.[0];
              if (part && part.text) {
                yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: part.text } };
              }
              if (part && part.functionCall) {
                if (part.functionCall.name) {
                  yield { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'call_' + Date.now(), name: part.functionCall.name, input: {} } };
                }
                if (part.functionCall.args) {
                  yield { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: JSON.stringify(part.functionCall.args) } };
                }
              }
              if (parsed.candidates?.[0]?.finishReason) {
                yield { type: 'message_delta', delta: { stop_reason: parsed.candidates[0].finishReason === 'STOP' ? 'end_turn' : 'tool_use' }, usage: { output_tokens: 0 } };
              }
            } catch (e) {}
          }
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = { GeminiAdapter };
