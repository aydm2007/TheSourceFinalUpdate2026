'use strict';

const path = require('path');

function isFreeOrOpenRouterModel(model = '') {
  const m = String(model).toLowerCase();
  return (
    m.endsWith(':free') ||
    m.startsWith('openai/') ||
    m.startsWith('google/') ||
    m.startsWith('meta/') ||
    m.startsWith('anthropic/') ||
    m.startsWith('qwen/') ||
    m.startsWith('mistral/') ||
    m.startsWith('nvidia/') ||
    m.startsWith('poolside/') ||
    m.startsWith('z-ai/') ||
    m.startsWith('zai/')
  );
}

function isDeepSeekModel(model = '') {
  const m = String(model).toLowerCase();
  return m.startsWith('deepseek-ai/') || m.startsWith('deepseek-') || m.includes('/deepseek');
}

function pickFirstCsv(value) {
  if (!value) return '';
  return String(value).split(',').map((v) => v.trim()).find(Boolean) || '';
}

function resolveProviderHint({ provider, model, env }) {
  const forced = String(provider || env.AETHER_PROVIDER || '').toLowerCase().trim();
  if (forced) return forced;
  if (isFreeOrOpenRouterModel(model)) return 'openrouter';
  if (isDeepSeekModel(model)) return 'siliconflow';
  return 'openrouter';
}

function createProviderRouter(options = {}) {
  const env = options.env || process.env;
  const workspaceRoot = path.resolve(options.workspaceRoot || env.AETHER_WORKSPACE_ROOT || process.cwd());
  const model = options.model || env.AETHER_MODEL || '';
  const provider = resolveProviderHint({ provider: options.provider, model, env });

  const baseURLs = {
    openrouter: env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    siliconflow: env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.com/v1',
    deepseek: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    openai: env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  };

  const keySources = {
    openrouter: pickFirstCsv(env.OPENROUTER_API_KEY || env.OPENROUTER_KEYS || env.AETHER_OR_KEYS || env.AETHER_RELAY_KEY_ALPHA),
    siliconflow: pickFirstCsv(env.SILICONFLOW_API_KEY || env.SILICONFLOW_KEYS || env.AETHER_SF_KEYS),
    deepseek: pickFirstCsv(env.DEEPSEEK_API_KEY),
    openai: pickFirstCsv(env.OPENAI_API_KEY)
  };

  const selectedBaseURL = baseURLs[provider] || baseURLs.openrouter;
  const selectedKey = keySources[provider] || keySources.openrouter || keySources.siliconflow || keySources.deepseek || keySources.openai || '';

  const plannerModel = options.plannerModel || env.AETHER_PLANNER_MODEL || model || 'openrouter/free';
  const executorModel = options.executorModel || env.AETHER_EXECUTOR_MODEL || model || plannerModel;

  const modelRouting = {
    requestedModel: model,
    provider,
    baseURL: selectedBaseURL,
    apiKey: selectedKey,
    plannerModel,
    executorModel,
    workspaceRoot,
    strategy: isFreeOrOpenRouterModel(model) ? 'openrouter-free' : isDeepSeekModel(model) ? 'deepseek-native' : 'adaptive'
  };

  function resolveModelForRequest(targetModel = model, preferredProvider = provider) {
    const activeProvider = resolveProviderHint({ provider: preferredProvider, model: targetModel, env });
    if (activeProvider === 'openrouter') return targetModel;
    if (activeProvider === 'siliconflow') return targetModel;
    if (activeProvider === 'deepseek') return targetModel;
    if (activeProvider === 'openai') return targetModel;
    return targetModel;
  }

  return {
    ...modelRouting,
    resolveModelForRequest,
    isFreeOrOpenRouterModel,
    isDeepSeekModel
  };
}

module.exports = {
  createProviderRouter,
  resolveProviderHint,
  isFreeOrOpenRouterModel,
  isDeepSeekModel
};
