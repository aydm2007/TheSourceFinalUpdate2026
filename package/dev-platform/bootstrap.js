'use strict';

const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonIfChanged(filePath, value) {
  ensureDir(path.dirname(filePath));
  const next = JSON.stringify(value, null, 2) + '\n';
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (current !== next) {
    fs.writeFileSync(filePath, next, 'utf8');
  }
}

function argValue(flag) {
  const argv = process.argv.slice(2);
  const idx = argv.findIndex((arg) => arg === flag || arg.startsWith(`${flag}=`));
  if (idx === -1) return null;
  const current = argv[idx];
  if (current.includes('=')) return current.split('=').slice(1).join('=');
  return argv[idx + 1] && !argv[idx + 1].startsWith('--') ? argv[idx + 1] : null;
}

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

function resolveProvider(model, forcedProvider, env) {
  const preferred = String(forcedProvider || env.AETHER_PROVIDER || '').toLowerCase().trim();
  if (preferred) return preferred;
  if (isFreeOrOpenRouterModel(model)) return 'openrouter';
  if (isDeepSeekModel(model)) return 'siliconflow';
  return 'openrouter';
}

function pickFirstCsv(value) {
  if (!value) return '';
  return String(value).split(',').map((v) => v.trim()).find(Boolean) || '';
}

function resolveProviderConfig({ model, provider, plannerModel, executorModel, env }) {
  const selectedProvider = resolveProvider(model, provider, env);

  const providerMatrix = {
    openrouter: {
      name: 'openrouter',
      baseURL: env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: pickFirstCsv(env.OPENROUTER_API_KEY || env.OPENROUTER_KEYS || env.AETHER_OR_KEYS || env.AETHER_RELAY_KEY_ALPHA),
      supportsTools: true,
      supportsJson: true,
      allowReasoning: true
    },
    siliconflow: {
      name: 'siliconflow',
      baseURL: env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.com/v1',
      apiKey: pickFirstCsv(env.SILICONFLOW_API_KEY || env.SILICONFLOW_KEYS || env.AETHER_SF_KEYS),
      supportsTools: true,
      supportsJson: true,
      allowReasoning: true
    },
    deepseek: {
      name: 'deepseek',
      baseURL: env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      apiKey: pickFirstCsv(env.DEEPSEEK_API_KEY),
      supportsTools: true,
      supportsJson: true,
      allowReasoning: true
    },
    openai: {
      name: 'openai',
      baseURL: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: pickFirstCsv(env.OPENAI_API_KEY),
      supportsTools: true,
      supportsJson: true,
      allowReasoning: true
    }
  };

  const providerConfig = providerMatrix[selectedProvider] || providerMatrix.openrouter;
  const planner = plannerModel || env.AETHER_PLANNER_MODEL || model || env.AETHER_MODEL || 'openai/gpt-oss-120b:free';
  const executor = executorModel || env.AETHER_EXECUTOR_MODEL || 'Qwen/Qwen2.5-Coder-32B-Instruct';

  return {
    provider: providerConfig.name,
    baseURL: providerConfig.baseURL,
    apiKey: providerConfig.apiKey,
    supportsTools: providerConfig.supportsTools,
    supportsJson: providerConfig.supportsJson,
    allowReasoning: providerConfig.allowReasoning,
    plannerModel: planner,
    executorModel: executor,
    requestedModel: model || planner
  };
}

function ensureMcpConfig(workspaceRoot, env) {
  const mcpPath = path.join(workspaceRoot, '.mcp.json');
  const existing = readJson(mcpPath, { mcpServers: {} }) || { mcpServers: {} };
  const mcpServers = existing.mcpServers && typeof existing.mcpServers === 'object' ? existing.mcpServers : {};

  const bridgeCommand = env.MCP_BRIDGE_COMMAND || process.execPath;
  const bridgeArgs = env.MCP_BRIDGE_ARGS
    ? env.MCP_BRIDGE_ARGS.split('âŸ')
    : [path.join(workspaceRoot, 'mcp_bridge_server.js')];

  if (!mcpServers['thesource-local-stdio']) {
    mcpServers['thesource-local-stdio'] = {
      command: bridgeCommand,
      args: bridgeArgs,
      env: {
        AETHER_WORKSPACE_ROOT: workspaceRoot,
        AETHER_PLATFORM_MODE: 'developer'
      }
    };
  }

  const next = {
    ...existing,
    mcpServers
  };

  writeJsonIfChanged(mcpPath, next);
  return next;
}

function bootstrapDeveloperPlatform(options = {}) {
  if (globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__) {
    return globalThis.__AETHER_DEV_PLATFORM__;
  }

  const workspaceRoot = path.resolve(
    options.workspaceRoot || process.env.AETHER_WORKSPACE_ROOT || process.cwd()
  );

  const model = options.model || argValue('--model') || process.env.AETHER_MODEL || '';
  const provider = options.provider || argValue('--provider') || process.env.AETHER_PROVIDER || '';
  const plannerModel = options.plannerModel || argValue('--planner-model') || process.env.AETHER_PLANNER_MODEL || '';
  const executorModel = options.executorModel || argValue('--executor-model') || process.env.AETHER_EXECUTOR_MODEL || '';

  const resolved = resolveProviderConfig({
    model,
    provider,
    plannerModel,
    executorModel,
    env: process.env
  });

  process.env.AETHER_PLATFORM_MODE = 'developer';
  process.env.AETHER_WORKSPACE_ROOT = workspaceRoot;
  process.env.AETHER_MODEL = model || resolved.requestedModel;
  process.env.AETHER_PROVIDER = resolved.provider;
  process.env.AETHER_PLANNER_MODEL = resolved.plannerModel;
  process.env.AETHER_EXECUTOR_MODEL = resolved.executorModel;
  process.env.AETHER_PLANNER_PROVIDER = process.env.AETHER_PLANNER_PROVIDER || 'openrouter';
  process.env.AETHER_EXECUTOR_PROVIDER = process.env.AETHER_EXECUTOR_PROVIDER || 'siliconflow';
  process.env.AETHER_MODEL_ROUTER = 'adaptive';
  process.env.AETHER_CONTEXT_STRATEGY = 'graph';
  process.env.AETHER_MCP_MODE = 'native';
  process.env.AETHER_SKIP_PERMISSION_GUARD = process.argv.includes('--dangerously-skip-permissions') ? '1' : '0';
  process.env.CLAUDE_CODE_SKIP_PERMISSIONS = process.argv.includes('--dangerously-skip-permissions') ? '1' : (process.env.CLAUDE_CODE_SKIP_PERMISSIONS || '0');

  const contextEngine = require('./context-engine.js').createContextEngine({
    workspaceRoot,
    requestedModel: resolved.requestedModel,
    provider: resolved.provider
  });

  const mcpRuntime = require('./mcp-native-runtime.js').createMcpRuntime({
    workspaceRoot
  });

  const providerRouter = require('./provider-router.js').createProviderRouter({
    workspaceRoot,
    provider: resolved.provider,
    model: resolved.requestedModel,
    plannerModel: resolved.plannerModel,
    executorModel: resolved.executorModel
  });

  ensureMcpConfig(workspaceRoot, process.env);

  const runtimeState = {
    mode: 'developer',
    workspaceRoot,
    platform: 'Sovereign MCP-Native Developer AI Platform',
    provider: resolved.provider,
    baseURL: resolved.baseURL,
    requestedModel: resolved.requestedModel,
    plannerModel: resolved.plannerModel,
    executorModel: resolved.executorModel,
    mcpServers: Object.keys(mcpRuntime.config.mcpServers || {}),
    toolCount: Array.isArray(mcpRuntime.tools) ? mcpRuntime.tools.length : 0,
    bootTimestamp: new Date().toISOString()
  };

  const runtimeDir = path.join(workspaceRoot, '.agents', 'runtime');
  ensureDir(runtimeDir);
  writeJsonIfChanged(path.join(runtimeDir, 'developer-platform.json'), runtimeState);

  globalThis.AETHER_CONTEXT_ENGINE = contextEngine;
  globalThis.AETHER_MCP_RUNTIME = mcpRuntime;
  globalThis.AETHER_PROVIDER_ROUTER = providerRouter;
  globalThis.__AETHER_DEV_PLATFORM__ = {
    ...runtimeState,
    contextEngine,
    mcpRuntime,
    providerRouter
  };

  globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__ = true;
  return globalThis.__AETHER_DEV_PLATFORM__;
}

module.exports = {
  bootstrapDeveloperPlatform,
  resolveProviderConfig,
  ensureMcpConfig
};
