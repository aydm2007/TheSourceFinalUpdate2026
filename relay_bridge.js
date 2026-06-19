// relay_bridge.js — Aether Engine Sovereign Relay Bridge
// Multi-Node Oracle Access Protocol with Auto-Provider Failover & Dynamic ENV-Decoupled Routing

let modelAdaptation;
try {
  modelAdaptation = require('./model_adaptation_contract.js');
} catch (error) {
  modelAdaptation = require('../model_adaptation_contract.js');
}

const {
  applyDeterministicContract,
  inferProviderForModel,
  shouldPreserveModelForProvider
} = modelAdaptation;

const logger = require('./core/diagnostics/bridge_logger.js');

class RelayBridge {
  constructor(apiKey) {
    // Build list of available providers from environment variables
    this.providers = [];

    // 1. OpenAI-compatible native configuration
    const openAiKeysString = process.env.OPENAI_API_KEY || process.env.OPENAI_KEYS;
    const openAiKeys = openAiKeysString ? openAiKeysString.split(',').map(k => k.trim()).filter(Boolean) : [];
    if (openAiKeys.length > 0) {
      this.providers.push({
        name: 'openai',
        keys: openAiKeys,
        baseURL: this.normalizeBaseURL(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions'),
        models: {
          planner: process.env.OPENAI_PLANNER_MODEL || process.env.AETHER_PLANNER_MODEL || 'gpt-4o',
          executor: process.env.OPENAI_EXECUTOR_MODEL || process.env.AETHER_EXECUTOR_MODEL || 'gpt-4o'
        }
      });
    }

    // 2. Google Gemini OpenAI-compatible configuration
    const googleKeysString = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const googleKeys = googleKeysString ? googleKeysString.split(',').map(k => k.trim()).filter(Boolean) : [];
    if (googleKeys.length > 0) {
      this.providers.push({
        name: 'google',
        keys: googleKeys,
        baseURL: this.normalizeBaseURL(process.env.GEMINI_BASE_URL || process.env.GOOGLE_GENERATIVE_AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'),
        models: {
          planner: process.env.GEMINI_PLANNER_MODEL || process.env.GOOGLE_PLANNER_MODEL || process.env.AETHER_PLANNER_MODEL || 'gemini-2.5-pro',
          executor: process.env.GEMINI_EXECUTOR_MODEL || process.env.GOOGLE_EXECUTOR_MODEL || process.env.AETHER_EXECUTOR_MODEL || 'gemini-2.5-pro'
        }
      });
    }

    // 3. SiliconFlow configuration
    const sfKeysString = process.env.AETHER_SF_KEYS || process.env.SILICONFLOW_KEYS || process.env.SILICONFLOW_API_KEY_AYMAN;
    const sfKeys = sfKeysString ? sfKeysString.split(',').map(k => k.trim()).filter(Boolean) : [];
    if (sfKeys.length > 0) {
      this.providers.push({
        name: 'siliconflow',
        keys: sfKeys,
        baseURL: this.normalizeBaseURL(process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.com/v1/chat/completions'),
        models: {
          planner: process.env.SILICONFLOW_PLANNER_MODEL || process.env.AETHER_PLANNER_MODEL || 'deepseek-ai/DeepSeek-V3',
          executor: process.env.SILICONFLOW_EXECUTOR_MODEL || process.env.AETHER_EXECUTOR_MODEL || 'deepseek-ai/DeepSeek-V3'
        }
      });
    }

    // 4. OpenRouter configuration
    const orKeysString = process.env.AETHER_OR_KEYS || process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEYS || process.env.AETHER_RELAY_KEY_ALPHA;
    const orKeys = orKeysString ? orKeysString.split(',').map(k => k.trim()).filter(Boolean) : [];
    if (orKeys.length > 0) {
      this.providers.push({
        name: 'openrouter',
        keys: orKeys,
        baseURL: this.normalizeBaseURL(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions'),
        models: {
          planner: process.env.OPENROUTER_PLANNER_MODEL || process.env.AETHER_PLANNER_MODEL || 'google/gemini-2.5-flash:free',
          executor: process.env.OPENROUTER_EXECUTOR_MODEL || process.env.AETHER_EXECUTOR_MODEL || 'qwen/qwen-2.5-7b-instruct:free'
        }
      });
    }

    // 5. GitHub configuration
    if (process.env.GITHUB_MODELS_TOKEN) {
      this.providers.push({
        name: 'github',
        keys: [process.env.GITHUB_MODELS_TOKEN],
        baseURL: this.normalizeBaseURL(process.env.GITHUB_MODELS_URL || 'https://models.inference.ai.azure.com/chat/completions'),
        models: {
          planner: process.env.GITHUB_PLANNER_MODEL || process.env.AETHER_PLANNER_MODEL || 'gpt-4o',
          executor: process.env.GITHUB_EXECUTOR_MODEL || process.env.AETHER_EXECUTOR_MODEL || 'gpt-4o-mini'
        }
      });
    }

    // Default fallback if no providers configured
    if (this.providers.length === 0) {
      const fallbackKey = apiKey || process.env.AETHER_RELAY_KEY_ALPHA;
      this.providers.push({
        name: 'siliconflow',
        keys: fallbackKey ? [fallbackKey] : [],
        baseURL: this.normalizeBaseURL(process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.com/v1/chat/completions'),
        models: {
          planner: process.env.SILICONFLOW_PLANNER_MODEL || process.env.AETHER_PLANNER_MODEL || 'deepseek-ai/DeepSeek-V3',
          executor: process.env.SILICONFLOW_EXECUTOR_MODEL || process.env.AETHER_EXECUTOR_MODEL || 'deepseek-ai/DeepSeek-V3'
        }
      });
    }

    // Set initial active provider based on environment setting or first available
    const preferredProvider = (process.env.AETHER_PROVIDER || 'siliconflow').toLowerCase();
    let initialIndex = this.providers.findIndex(p => p.name === preferredProvider);
    if (initialIndex === -1) initialIndex = 0;

    this.activeProviderIndex = initialIndex;
    this.updateActiveProviderConfig();

    this.maxRetries = parseInt(process.env.AETHER_MAX_RETRIES || '5', 10);
    this.retryDelayMs = parseInt(process.env.AETHER_RETRY_DELAY_MS || '2000', 10);
    this.timeoutMs = parseInt(process.env.AETHER_TIMEOUT_MS || '300000', 10);
    this._failoverAttempted = false;
    this.latencies = { Alpha: Infinity, Beta: Infinity };
    this.lastPingTime = 0;
    this.cacheDuration = 5 * 60 * 1000;
    this.visionCache = new Map();
  }

  normalizeBaseURL(url) {
    if (!url) return '';
    let cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/chat/completions')) {
      cleanUrl += '/chat/completions';
    }
    return cleanUrl;
  }

  updateActiveProviderConfig() {
    const provider = this.providers[this.activeProviderIndex];
    this.provider = provider.name;
    this.keysPool = provider.keys;
    this.keyIndex = 0;
    this.primaryKey = provider.keys[0] || '';
    this.fallbackKey = provider.keys[1] || this.primaryKey;
    this.apiKey = this.primaryKey;
    this.baseURL = provider.baseURL;
    this.activeNode = provider.name.toUpperCase();
    
    // Set models based on provider selection
    this.plannerModel = provider.models.planner;
    this.executiveModel = provider.models.executor;
    this.model = process.env.AETHER_MODEL || this.plannerModel;

    logger.info(`Active Provider set to: ${this.provider.toUpperCase()} (${this.baseURL})`, { provider: this.provider, baseURL: this.baseURL });
  }

  useProvider(providerName) {
    const target = String(providerName || '').toLowerCase().trim();
    if (!target) return false;
    const targetIndex = this.providers.findIndex(p => p.name === target);
    if (targetIndex === -1) return false;
    if (targetIndex !== this.activeProviderIndex) {
      this.activeProviderIndex = targetIndex;
      this.updateActiveProviderConfig();
    }
    return true;
  }

  configureProviderForModel(modelName) {
    if (!modelName) return;
    
    // Read openrouter patterns from ENV if defined, otherwise use standard defaults
    // Patterns list (e.g. ":free,openai/,google/,meta/,anthropic/,qwen/")
    const orPatternsString = process.env.AETHER_OPENROUTER_PATTERNS || ':free,openai/,google/,meta/,anthropic/,qwen/';
    const orPatterns = orPatternsString.split(',').map(p => p.trim()).filter(Boolean);
    
    let determinedProvider = inferProviderForModel(modelName, (process.env.AETHER_PROVIDER || 'siliconflow').toLowerCase());
    
    // Check if modelName matches any of the openrouter patterns
    const matchesOpenRouter = orPatterns.some(pattern => {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // Regex pattern
        try {
          const regex = new RegExp(pattern.slice(1, -1), 'i');
          return regex.test(modelName);
        } catch(e) {
          return modelName.toLowerCase().includes(pattern.toLowerCase());
        }
      }
      return modelName.toLowerCase().includes(pattern.toLowerCase());
    });

    if (matchesOpenRouter && determinedProvider !== 'openai' && determinedProvider !== 'google') {
      determinedProvider = 'openrouter';
    } else if (modelName.toLowerCase().startsWith('github/') || modelName.toLowerCase().startsWith('azure/')) {
      determinedProvider = 'github';
    }

    // Now switch activeProviderIndex if needed
    let targetIndex = this.providers.findIndex(p => p.name === determinedProvider);
    if (targetIndex !== -1 && targetIndex !== this.activeProviderIndex) {
      logger.info(`Dynamic Provider Detection: Switching active provider to "${determinedProvider}" for model "${modelName}"`, { determinedProvider, modelName });
      this.activeProviderIndex = targetIndex;
      this.updateActiveProviderConfig();
    }
  }

  mapModelForProvider(modelName, providerName) {
    if (!modelName) return modelName;
    const provider = (providerName || '').toLowerCase();
    const modelLower = modelName.toLowerCase();

    if (shouldPreserveModelForProvider(modelName, provider)) {
      return modelName;
    }
    
    const provConfig = this.providers.find(p => p.name === provider);
    const defaultPlanner = provConfig ? provConfig.models.planner : 'deepseek-ai/DeepSeek-V3';

    if (provider === 'siliconflow') {
      const isDeepSeekV4 = modelLower.includes('deepseek-v4') || modelLower.includes('deepseek-chat') || modelLower.includes('deepseek-v3');
      const isDeepSeekR1 = modelLower.includes('deepseek-r1') || modelLower.includes('reason') || modelLower === 'openai/gpt-oss-120b:free';
      const isQwenCoder = modelLower.includes('qwen') && (modelLower.includes('coder') || modelLower.includes('code'));
      const isQwen = modelLower.includes('qwen') && !isQwenCoder;

      if (isDeepSeekR1) return 'deepseek-ai/DeepSeek-V4-Pro';
      if (isDeepSeekV4) return 'deepseek-ai/DeepSeek-V4-Flash';
      if (isQwenCoder) return 'Qwen/Qwen3.6-35B-A3B';
      if (isQwen) return 'Qwen/Qwen3.6-27B';

      // Fallbacks for general patterns
      if (modelLower.includes('r1') || modelLower.includes('reasoner') || modelLower.includes('reasoning')) {
        return 'deepseek-ai/DeepSeek-V4-Pro';
      }
      if (modelLower.includes('coder') || modelLower.includes('executor') || modelLower.includes('coding') || modelLower.includes('code')) {
        return 'Qwen/Qwen3.6-35B-A3B';
      }
      return 'deepseek-ai/DeepSeek-V4-Flash';
    }

    if (provider === 'github') {
      const allowedModels = ['gpt-4o', 'gpt-4o-mini', 'cohere-command-r-plus', 'meta-llama-3-70b-instruct'];
      const isAllowed = allowedModels.some(am => modelLower.includes(am));
      if (!isAllowed) {
        if (modelLower.includes('mini') || modelLower.includes('flash') || modelLower.includes('executor') || modelLower.includes('coding') || modelLower.includes('code')) {
          return 'gpt-4o-mini';
        }
        return 'gpt-4o';
      }
      return modelName;
    }

    if (provider === 'openrouter') return modelName;
    if (provider === 'openai') return modelLower.startsWith('openai/') ? modelName.split('/').slice(1).join('/') : modelName;
    if (provider === 'google') return modelLower.startsWith('google/') ? modelName.split('/').slice(1).join('/') : modelName;

    return modelName;
  }

  buildAdaptedMessages({ model, messages, system, tools }) {
    const rawMessages = applyDeterministicContract({
      messages,
      system,
      model,
      provider: this.provider,
      tools
    });
    return translateMessagesToOpenAI(rawMessages);
  }


  switchToNextProvider() {
    this.activeProviderIndex = (this.activeProviderIndex + 1) % this.providers.length;
    this.updateActiveProviderConfig();
    logger.warn(`Switching to next available provider: ${this.provider.toUpperCase()}`, { newProvider: this.provider });
  }

  async pingNodes() {
    const now = Date.now();
    if (now - this.lastPingTime < this.cacheDuration && this.latencies.Alpha !== Infinity) return;

    const ping = async (key) => {
        if (!key) return Infinity;
        const start = Date.now();
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000);
            await fetch(this.baseURL, { method: 'HEAD', headers: { 'Authorization': `Bearer ${key}` }, signal: controller.signal });
            clearTimeout(id);
            return Date.now() - start;
        } catch { return Infinity; }
    };
    const results = await Promise.all([ping(this.primaryKey), ping(this.fallbackKey)]);
    this.latencies.Alpha = results[0];
    this.latencies.Beta = results[1];
    this.lastPingTime = now;
  }

  async getOptimalNode() {
      if (this.provider !== 'siliconflow') return;
      await this.pingNodes();
      const prevNode = this.activeNode;
      this.activeNode = this.latencies.Alpha <= this.latencies.Beta ? 'Alpha' : 'Beta';
      const selectedKey = this.activeNode === 'Alpha' ? this.primaryKey : this.fallbackKey;
      if (selectedKey) this.apiKey = selectedKey;
      if (prevNode !== this.activeNode) {
        logger.info(`Switched to Node: ${this.activeNode}`, { latencies: this.latencies, activeNode: this.activeNode });
      }
  }

  healthCheck() {
    return {
      status: this.apiKey ? 'active' : 'dormant',
      activeNode: this.activeNode,
      provider: this.provider,
      model: this.model,
      baseURL: this.baseURL,
      timestamp: new Date().toISOString()
    };
  }

  _tryFailover() {
    if (this._failoverAttempted) return false;
    this._failoverAttempted = true;
    this.switchToNextProvider();
    return true;
  }

  async _fetchWithTimeout(url, options, customTimeout) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), customTimeout || this.timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally { clearTimeout(timeout); }
  }

  async createMessage(params) {
    return this.createPulse(params);
  }

  async createPulse(params) {
    const { model, messages, system, temperature, max_tokens, tools, tool_choice, provider } = params;
    if (provider) {
      this.useProvider(provider);
    } else {
      this.configureProviderForModel(model || this.model);
    }
    await this.getOptimalNode();
    
    const formattedMessages = this.buildAdaptedMessages({
      model: model || this.model,
      messages,
      system,
      tools
    });

    const crypto = require('crypto');
    const isVisionRequest = (model || this.model || '').toLowerCase().includes('nemotron') || (model || this.model || '').toLowerCase().includes('vl');
    let visionCacheKey = '';
    if (isVisionRequest) {
      visionCacheKey = crypto.createHash('sha256').update(JSON.stringify({ model: model || this.model, messages: formattedMessages })).digest('hex');
      if (this.visionCache && this.visionCache.has(visionCacheKey)) {
        const cached = this.visionCache.get(visionCacheKey);
        if (Date.now() - cached.timestamp < 15 * 60 * 1000) { // 15 mins TTL
          logger.info(`[VISION-CACHE-HIT] Reusing cached analysis for model ${model || this.model}`, { visionCacheKey });
          return cached.response;
        }
      }
    }

    let lastError;
    let providerAttempt = 0;
    const maxProviderAttempts = this.providers.length;

    while (providerAttempt < maxProviderAttempts) {
      let requestApiKey = this.apiKey;
      const targetModel = model || this.model;
      
      let finalModelName = targetModel;
      if (targetModel.toLowerCase().includes('nemotron') && process.env.AETHER_VISION_API_KEY) {
        requestApiKey = process.env.AETHER_VISION_API_KEY;
      } else if (targetModel.toLowerCase().includes('opponent') && process.env.AETHER_XX_API_KEY) {
        requestApiKey = process.env.AETHER_XX_API_KEY;
        finalModelName = targetModel.replace(/-opponent/i, '').replace(/opponent-/i, '').replace(/opponent/i, '');
      }

      const resolvedModel = this.mapModelForProvider(finalModelName, this.provider);
      const maxLimit = 4096;
      const payload = {
        model: resolvedModel,
        messages: formattedMessages,
        temperature: temperature || 0.7,
        max_tokens: Math.min(max_tokens || 2048, maxLimit),
        stream: false
      };

      if (tools && tools.length > 0) {
        payload.tools = translateToolsToOpenAI(tools);
        if (tool_choice) payload.tool_choice = translateToolChoiceToOpenAI(tool_choice);
      }

      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          const response = await this._fetchWithTimeout(this.baseURL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${requestApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          }, isVisionRequest ? 15000 : this.timeoutMs);

          if (!response.ok) {
            const errText = await response.text();
            
            // Handle Rate Limit (429)
            if (response.status === 429) {
              if (this.keysPool && this.keysPool.length > 1) {
                this.keyIndex = (this.keyIndex + 1) % this.keysPool.length;
                this.apiKey = this.keysPool[this.keyIndex];
                logger.warn(`Key rate limited (429). Rotating to Key #${this.keyIndex + 1} for ${this.provider}...`, { provider: this.provider, status: 429 });
                await new Promise(r => setTimeout(r, 2000));
                continue;
              }
              // Switch provider immediately on rate limit if multiple keys aren't available
              logger.warn(`Provider ${this.provider} rate limited. Triggering provider failover.`, { provider: this.provider });
              break;
            }

            // Handle Server Busy (503)
            if (response.status === 503) {
              const delay = this.retryDelayMs * Math.pow(2, attempt);
              logger.warn(`Server busy (503). Retry in ${delay}ms`, { provider: this.provider, status: 503, delay });
              await new Promise(r => setTimeout(r, delay));
              
              // Try executor model if planner keeps failing
              if (attempt >= 2 && payload.model === this.plannerModel && this.executiveModel !== this.plannerModel) {
                logger.warn(`Planner model busy. Switching to Executor: ${this.executiveModel}`, { newModel: this.executiveModel });
                payload.model = this.executiveModel;
              }
              continue;
            }

            // Handle Bad Request / Format / Model mismatch (400, 404)
            if (response.status === 400 || response.status === 404) {
              logger.warn(`Provider request failed (status ${response.status}) with ${this.provider}. Triggering immediate provider failover.`, { provider: this.provider, status: response.status });
              break;
            }

            // Authentication / Expiry / Credit error (401, 403, 402)
            if (response.status === 401 || response.status === 403 || response.status === 402) {
              if (this.keysPool && this.keysPool.length > 1) {
                this.keyIndex = (this.keyIndex + 1) % this.keysPool.length;
                this.apiKey = this.keysPool[this.keyIndex];
                logger.warn(`Key failed with status ${response.status}. Rotating to Key #${this.keyIndex + 1} for ${this.provider}...`, { provider: this.provider, status: response.status });
                await new Promise(r => setTimeout(r, 500));
                continue;
              }
              logger.warn(`Provider failure (status ${response.status}) with ${this.provider}. Triggering provider failover.`, { provider: this.provider, status: response.status });
              break;
            }

            throw new Error(`Relay API error: ${response.status} ${errText}`);
          }

          const data = await response.json();
          const msg = data.choices[0].message;
          const contentBlocks = [];
          if (msg.content) contentBlocks.push({ type: 'text', text: msg.content });
          if (msg.tool_calls) {
            for (const tc of msg.tool_calls) {
              contentBlocks.push({
                type: 'tool_use', id: tc.id, name: tc.function.name,
                input: repairJson(tc.function.arguments || '{}')
              });
            }
          }
          
          const result = {
            id: data.id || `pulse_${Date.now()}`,
            type: 'message', role: 'assistant',
            content: contentBlocks, model: data.model,
            stop_reason: data.choices[0].finish_reason === 'stop' ? 'end_turn' : 'tool_use',
            usage: { input_tokens: data.usage?.prompt_tokens || 0, output_tokens: data.usage?.completion_tokens || 0 }
          };
          if (isVisionRequest && visionCacheKey) {
            this.visionCache.set(visionCacheKey, { timestamp: Date.now(), response: result });
          }
          return result;
        } catch (e) {
          lastError = e;
          if (attempt < this.maxRetries - 1) {
            await new Promise(r => setTimeout(r, this.retryDelayMs * Math.pow(2, attempt)));
          }
        }
      }

      // If we reach here, the current provider failed completely. Switch and retry.
      logger.error(`Provider "${this.provider}" failed with error: ${lastError?.message || lastError}`, { provider: this.provider, error: lastError?.message || String(lastError) });
      providerAttempt++;
      if (providerAttempt < maxProviderAttempts) {
        this.switchToNextProvider();
      }
    }
    throw lastError || new Error('Relay: All providers exhausted');
  }

  async *emitPulse(params) {
    const { model, messages, system, temperature, max_tokens, tools } = params;
    this.configureProviderForModel(model || this.model);
    const formattedMessages = this.buildAdaptedMessages({
      model: model || this.model,
      messages,
      system,
      tools
    });

    let providerAttempt = 0;
    const maxProviderAttempts = this.providers.length;
    let lastError;

    while (providerAttempt < maxProviderAttempts) {
      const targetModel = model || this.model;
      const resolvedModel = this.mapModelForProvider(targetModel, this.provider);
      const maxLimit = 4096;
      const payload = {
        model: resolvedModel,
        messages: formattedMessages,
        temperature: temperature || 0.7,
        max_tokens: Math.min(max_tokens || 2048, maxLimit),
        stream: true
      };

      if (tools && tools.length > 0) payload.tools = translateToolsToOpenAI(tools);

      try {
        let response;
        for (let attempt = 0; attempt < 3; attempt++) {
          response = await this._fetchWithTimeout(this.baseURL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.ok) break;

          if (response.status === 400 || response.status === 404 || response.status === 401 || response.status === 403 || response.status === 402) {
            if ((response.status === 401 || response.status === 403 || response.status === 402) && this.keysPool && this.keysPool.length > 1) {
              this.keyIndex = (this.keyIndex + 1) % this.keysPool.length;
              this.apiKey = this.keysPool[this.keyIndex];
              logger.warn(`Stream key failed (status ${response.status}). Rotating to Key #${this.keyIndex + 1}...`, { provider: this.provider, status: response.status });
              attempt--;
              continue;
            }
            logger.warn(`Stream provider failure (status ${response.status}) with ${this.provider}. Triggering provider failover.`, { provider: this.provider, status: response.status });
            break;
          }

          if (response.status === 429 && this.keysPool && this.keysPool.length > 1) {
            this.keyIndex = (this.keyIndex + 1) % this.keysPool.length;
            this.apiKey = this.keysPool[this.keyIndex];
            logger.warn(`Stream key rate limited. Rotating to Key #${this.keyIndex + 1}...`, { provider: this.provider, status: 429 });
            attempt--;
            continue;
          }

          if (response.status === 503 || response.status === 429) {
            const delay = 2000 * Math.pow(2, attempt);
            logger.warn(`Stream ${response.status} — Retry in ${delay}ms`, { provider: this.provider, status: response.status, delay });
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Relay Pulse: Server busy after retries`);
        }

        const reader = response.body;
        const decoder = new TextDecoder();
        let buffer = '';

        yield {
          type: 'message_start',
          message: { id: `pulse_stream_${Date.now()}`, type: 'message', role: 'assistant', model: payload.model, usage: { input_tokens: 0, output_tokens: 0 } }
        };

        const bufferedTools = [];

        for await (const chunk of reader) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                for (let i = 0; i < bufferedTools.length; i++) {
                  const tool = bufferedTools[i];
                  if (!tool) continue;
                  const toolIndex = i + 1;
                  
                  yield {
                    type: 'content_block_start',
                    index: toolIndex,
                    content_block: { type: 'tool_use', id: tool.id, name: tool.name, input: {} }
                  };
                  
                  const repairedJsonStr = JSON.stringify(repairJson(tool.arguments));
                  yield {
                    type: 'content_block_delta',
                    index: toolIndex,
                    delta: { type: 'input_json_delta', partial_json: repairedJsonStr }
                  };
                  
                  yield {
                    type: 'content_block_stop',
                    index: toolIndex
                  };
                }

                yield { type: 'message_stop' };
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                if (!delta) continue;

                if (delta.content) {
                  yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: delta.content } };
                }

                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index !== undefined ? tc.index : 0;
                    if (!bufferedTools[idx]) {
                      bufferedTools[idx] = { id: '', name: '', arguments: '' };
                    }
                    if (tc.id) bufferedTools[idx].id = tc.id;
                    if (tc.function?.name) bufferedTools[idx].name = tc.function.name;
                    if (tc.function?.arguments) bufferedTools[idx].arguments += tc.function.arguments;
                  }
                }

                if (parsed.choices[0].finish_reason) {
                  yield { type: 'message_delta', delta: { stop_reason: parsed.choices[0].finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn' }, usage: { output_tokens: parsed.usage?.completion_tokens || 0 } };
                }
              } catch (e) {}
            }
          }
        }

        for (let i = 0; i < bufferedTools.length; i++) {
          const tool = bufferedTools[i];
          if (!tool) continue;
          const toolIndex = i + 1;
          
          yield {
            type: 'content_block_start',
            index: toolIndex,
            content_block: { type: 'tool_use', id: tool.id, name: tool.name, input: {} }
          };
          
          const repairedJsonStr = JSON.stringify(repairJson(tool.arguments));
          yield {
            type: 'content_block_delta',
            index: toolIndex,
            delta: { type: 'input_json_delta', partial_json: repairedJsonStr }
          };
          
          yield {
            type: 'content_block_stop',
            index: toolIndex
          };
        }
        yield { type: 'message_stop' };
        return; // Success
      } catch (e) {
        lastError = e;
        providerAttempt++;
        if (providerAttempt < maxProviderAttempts) {
          this.switchToNextProvider();
        }
      }
    }
    throw lastError || new Error('Relay: All providers exhausted');
  }
}

function repairJson(str) {
  if (!str) return {};
  let cleaned = str.trim();
  
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // 1. Convert single quotes to double quotes if they wrap keys/values
  let converted = '';
  let inDouble = false;
  let inSingle = false;
  let escapeChar = false;
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escapeChar) {
      converted += char;
      escapeChar = false;
      continue;
    }
    if (char === '\\') {
      converted += char;
      escapeChar = true;
      continue;
    }
    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
      converted += char;
      continue;
    }
    if (char === "'" && !inDouble) {
      inSingle = !inSingle;
      converted += '"';
      continue;
    }
    converted += char;
  }
  cleaned = converted;

  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  // 2. Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1').trim();

  let repaired = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escape) {
      repaired += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      repaired += char;
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      repaired += char;
      continue;
    }
    if (inString) {
      if (char === '\n') {
        repaired += '\\n';
      } else if (char === '\r') {
        repaired += '\\r';
      } else if (char === '\t') {
        repaired += '\\t';
      } else {
        repaired += char;
      }
    } else {
      repaired += char;
    }
  }
  cleaned = repaired;

  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  let openBraces = 0;
  let openBrackets = 0;
  let stringMode = false;
  let esc = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { stringMode = !stringMode; continue; }
    if (!stringMode) {
      if (c === '{') openBraces++;
      if (c === '}') openBraces = Math.max(0, openBraces - 1);
      if (c === '[') openBrackets++;
      if (c === ']') openBrackets = Math.max(0, openBrackets - 1);
    }
  }
  
  if (stringMode) {
    cleaned += '"';
  }
  
  while (openBrackets > 0) {
    cleaned += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    cleaned += '}';
    openBraces--;
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Suppressed noisy logging to prevent log pollution since fallback handles it gracefully
    return { _raw_arguments: str, _parse_error: e.message };
  }
}

module.exports = { RelayBridge, repairJson };

function translateMessagesToOpenAI(messages) {
  if (!Array.isArray(messages)) return messages;
  const converted = [];
  
  for (const msg of messages) {
    const role = msg.role;
    const content = msg.content;

    if (!content) {
      converted.push(msg);
      continue;
    }

    if (typeof content === 'string') {
      converted.push(msg);
      continue;
    }

    if (Array.isArray(content)) {
      const textParts = [];
      const toolCalls = [];
      let isToolResult = false;
      const toolResults = [];

      for (const block of content) {
        if (!block) continue;
        if (block.type === 'text') {
          textParts.push(block.text);
        } else if (block.type === 'image_url') {
          textParts.push(block);
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            type: 'function',
            function: {
              name: block.name,
              arguments: typeof block.input === 'object' ? JSON.stringify(block.input) : (block.input || '{}')
            }
          });
        } else if (block.type === 'tool_result') {
          isToolResult = true;
          let resContent = '';
          if (typeof block.content === 'string') {
            resContent = block.content;
          } else if (Array.isArray(block.content)) {
            resContent = block.content.map(b => b.text || JSON.stringify(b)).join('\n');
          } else {
            resContent = JSON.stringify(block.content || '');
          }
          toolResults.push({
            role: 'tool',
            tool_call_id: block.tool_use_id,
            content: resContent
          });
        }
      }

      if (isToolResult) {
        if (textParts.length > 0) {
          converted.push({
            role: 'user',
            content: textParts.join('\n')
          });
        }
        for (const tr of toolResults) {
          converted.push(tr);
        }
      } else {
        const textContent = textParts.map(t => typeof t === 'string' ? t : t.text || '').join('\n');
        const newMsg = {
          role: role,
          content: textContent || null
        };
        if (toolCalls.length > 0) {
          newMsg.tool_calls = toolCalls;
        }
        converted.push(newMsg);
      }
    } else {
      converted.push(msg);
    }
  }

  return converted;
}

function translateToolsToOpenAI(tools) {
  if (!Array.isArray(tools)) return tools;
  return tools.map(t => {
    if (t.type === 'function' && t.function) {
      return t;
    }
    return {
      type: 'function',
      function: {
        name: t.name,
        description: t.description || '',
        parameters: t.input_schema || { type: 'object', properties: {} }
      }
    };
  });
}

function translateToolChoiceToOpenAI(toolChoice) {
  if (!toolChoice) return undefined;
  if (typeof toolChoice === 'string') return toolChoice;
  if (toolChoice.type === 'auto') return 'auto';
  if (toolChoice.type === 'any') return 'required';
  if (toolChoice.type === 'tool' && toolChoice.name) {
    return {
      type: 'function',
      function: {
        name: toolChoice.name
      }
    };
  }
  return toolChoice;
}
