param(
    [string]$WorkspaceRoot = $PSScriptRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Backup-File {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$BackupRoot
    )

    if (Test-Path $Path) {
        $relative = $Path.Substring($WorkspaceRoot.Length).TrimStart('\','/')
        $target = Join-Path $BackupRoot $relative
        $targetDir = Split-Path -Parent $target
        if ($targetDir -and -not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item $Path $target -Force
    }
}

function Prepend-Text {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Prefix
    )

    $current = if (Test-Path $Path) { Get-Content -LiteralPath $Path -Raw } else { '' }
    if ($current.StartsWith($Prefix)) {
        return
    }
    Write-Utf8NoBom -Path $Path -Content ($Prefix + $current)
}

function Replace-Regex {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Pattern,
        [Parameter(Mandatory = $true)][string]$Replacement
    )

    $current = Get-Content -LiteralPath $Path -Raw
    $next = [regex]::Replace($current, $Pattern, $Replacement, 1)
    Write-Utf8NoBom -Path $Path -Content $next
}

$WorkspaceRoot = (Resolve-Path $WorkspaceRoot).Path
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $WorkspaceRoot ".patch-backups\$timestamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

$targets = @(
    'aether.ps1',
    'package\preload.js',
    '.mcp.json'
)

foreach ($relative in $targets) {
    $absolute = Join-Path $WorkspaceRoot $relative
    Backup-File -Path $absolute -BackupRoot $backupRoot
}

$devPlatformDir = Join-Path $WorkspaceRoot 'package\dev-platform'
New-Item -ItemType Directory -Path $devPlatformDir -Force | Out-Null

Write-Utf8NoBom -Path (Join-Path $devPlatformDir 'bootstrap.js') -Content @'
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
  const planner = plannerModel || env.AETHER_PLANNER_MODEL || model || env.AETHER_MODEL || 'openrouter/free';
  const executor = executorModel || env.AETHER_EXECUTOR_MODEL || model || planner;

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
    ? env.MCP_BRIDGE_ARGS.split('␟')
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

'@

Write-Utf8NoBom -Path (Join-Path $devPlatformDir 'provider-router.js') -Content @'
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

'@

Write-Utf8NoBom -Path (Join-Path $devPlatformDir 'context-engine.js') -Content @'
'use strict';

const fs = require('fs');
const path = require('path');

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readText(filePath, fallback = '') {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

function compactText(text, maxChars = 24000) {
  if (typeof text !== 'string') return '';
  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n');
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}\n\n...[TRUNCATED ${normalized.length - maxChars} CHARS]...`;
}

function collectWorkspaceSignals(workspaceRoot) {
  const root = path.resolve(workspaceRoot || process.cwd());
  const packageJson = path.join(root, 'package.json');
  const bridgeJson = path.join(root, 'bridge.json');
  const mcpJson = path.join(root, '.mcp.json');
  const toolsJson = path.join(root, 'config', 'mcp', 'tools.json');

  const signals = {
    workspaceRoot: root,
    hasPackageJson: exists(packageJson),
    hasBridgeJson: exists(bridgeJson),
    hasMcpJson: exists(mcpJson),
    hasToolsJson: exists(toolsJson),
    packageName: null,
    bridgeVersion: null,
    toolRegistryCount: 0
  };

  if (signals.hasPackageJson) {
    try {
      const pkg = JSON.parse(readText(packageJson, '{}'));
      signals.packageName = pkg.name || null;
      signals.packageVersion = pkg.version || null;
      signals.bin = pkg.bin || null;
    } catch {}
  }

  if (signals.hasBridgeJson) {
    try {
      const bridge = JSON.parse(readText(bridgeJson, '{}'));
      signals.bridgeVersion = bridge.bridgeVersion || null;
      signals.remoteMcpEnabled = bridge.remote_mcp_enabled === true;
      signals.allowedTools = Array.isArray(bridge.allowed_tools) ? bridge.allowed_tools.length : 0;
    } catch {}
  }

  if (signals.hasToolsJson) {
    try {
      const tools = JSON.parse(readText(toolsJson, '{"tools":[]}'));
      signals.toolRegistryCount = Array.isArray(tools.tools) ? tools.tools.length : 0;
    } catch {}
  }

  return signals;
}

function scoreFilesByPrompt(files = [], prompt = '') {
  const keywords = String(prompt || '')
    .toLowerCase()
    .split(/[^a-z0-9_\-./]+/i)
    .filter(Boolean);

  return files
    .map((file) => {
      const text = String(file.path || file.filePath || '').toLowerCase();
      const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 2 : 0), 0) + (file.important ? 3 : 0);
      return { ...file, score };
    })
    .sort((a, b) => b.score - a.score);
}

function createContextEngine(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.env.AETHER_WORKSPACE_ROOT || process.cwd());
  const signals = collectWorkspaceSignals(workspaceRoot);

  function summarizeWorkspace() {
    return {
      ...signals,
      mode: 'developer',
      contextStrategy: 'graph',
      provider: options.provider || process.env.AETHER_PROVIDER || 'openrouter',
      requestedModel: options.requestedModel || process.env.AETHER_MODEL || ''
    };
  }

  function buildPromptEnvelope(input = {}) {
    const prompt = String(input.prompt || input.userPrompt || '');
    const files = Array.isArray(input.files) ? input.files : [];
    const rankedFiles = scoreFilesByPrompt(files, prompt).slice(0, 12);
    const envelope = {
      summary: summarizeWorkspace(),
      prompt: compactText(prompt, 8000),
      files: rankedFiles,
      maxContextTokens: Number(input.maxContextTokens || 120000),
      policy: {
        useMcp: true,
        useWorkspaceGraph: true,
        preserveToolCallTrace: true
      }
    };
    return envelope;
  }

  function compactMessages(messages = [], budgetChars = 40000) {
    const arr = Array.isArray(messages) ? messages : [];
    const compacted = [];
    let used = 0;

    for (const message of arr) {
      const next = {
        role: message.role || 'user',
        content: compactText(String(message.content || ''), Math.max(2000, Math.floor(budgetChars / 2)))
      };
      const size = String(next.content).length + 32;
      if (used + size > budgetChars) break;
      compacted.push(next);
      used += size;
    }

    return compacted;
  }

  return {
    workspaceRoot,
    signals,
    summarizeWorkspace,
    buildPromptEnvelope,
    compactMessages,
    compactText,
    scoreFilesByPrompt
  };
}

module.exports = {
  createContextEngine,
  collectWorkspaceSignals,
  compactText,
  scoreFilesByPrompt
};

'@

Write-Utf8NoBom -Path (Join-Path $devPlatformDir 'mcp-native-runtime.js') -Content @'
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

function createDefaultServerSpec(workspaceRoot) {
  return {
    command: process.execPath,
    args: [path.join(workspaceRoot, 'mcp_bridge_server.js')],
    env: {
      AETHER_WORKSPACE_ROOT: workspaceRoot,
      AETHER_PLATFORM_MODE: 'developer'
    }
  };
}

function createMcpRuntime(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.env.AETHER_WORKSPACE_ROOT || process.cwd());
  const mcpPath = path.join(workspaceRoot, '.mcp.json');
  const toolsPath = path.join(workspaceRoot, 'config', 'mcp', 'tools.json');
  const runtimeDir = path.join(workspaceRoot, '.agents', 'runtime');

  const existing = readJson(mcpPath, { mcpServers: {} }) || { mcpServers: {} };
  const mcpServers = existing.mcpServers && typeof existing.mcpServers === 'object' ? existing.mcpServers : {};
  const defaultServer = createDefaultServerSpec(workspaceRoot);

  if (!mcpServers['thesource-local-stdio']) {
    mcpServers['thesource-local-stdio'] = defaultServer;
  }

  const config = {
    ...existing,
    mcpServers
  };

  writeJsonIfChanged(mcpPath, config);

  const tools = readJson(toolsPath, { tools: [] });
  const runtime = {
    workspaceRoot,
    configPath: mcpPath,
    config,
    defaultServer,
    tools: Array.isArray(tools.tools) ? tools.tools : [],
    toolCount: Array.isArray(tools.tools) ? tools.tools.length : 0,
    generatedAt: new Date().toISOString()
  };

  ensureDir(runtimeDir);
  writeJsonIfChanged(path.join(runtimeDir, 'mcp-native-runtime.json'), runtime);

  return runtime;
}

module.exports = {
  createMcpRuntime,
  createDefaultServerSpec
};

'@

$preloadPath = Join-Path $WorkspaceRoot 'package\preload.js'
$preloadPrefix = @'
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

'@
Prepend-Text -Path $preloadPath -Prefix $preloadPrefix

$aetherPath = Join-Path $WorkspaceRoot 'aether.ps1'
$aetherContent = @'
# Aether Engine — Sovereign CLI Wrapper
# Patch: Sovereign MCP-Native Developer AI Platform

$c = $args[0]
$remainingArgs = @()
if ($args.Count -gt 1) {
    $remainingArgs = $args[1..($args.Count - 1)]
}

function Resolve-AetherConsoleOptions {
    param(
        [string[]]$ConsoleArgs
    )

    $model = $null
    $provider = $null
    $plannerModel = $null
    $executorModel = $null

    for ($i = 0; $i -lt $ConsoleArgs.Count; $i++) {
        $arg = $ConsoleArgs[$i]

        if ($arg -eq '--model' -and ($i + 1) -lt $ConsoleArgs.Count) {
            $model = $ConsoleArgs[$i + 1]
            $i++
            continue
        }

        if ($arg -like '--model=*') {
            $model = $arg.Split('=', 2)[1]
            continue
        }

        if ($arg -eq '--provider' -and ($i + 1) -lt $ConsoleArgs.Count) {
            $provider = $ConsoleArgs[$i + 1]
            $i++
            continue
        }

        if ($arg -like '--provider=*') {
            $provider = $arg.Split('=', 2)[1]
            continue
        }

        if ($arg -eq '--planner-model' -and ($i + 1) -lt $ConsoleArgs.Count) {
            $plannerModel = $ConsoleArgs[$i + 1]
            $i++
            continue
        }

        if ($arg -eq '--executor-model' -and ($i + 1) -lt $ConsoleArgs.Count) {
            $executorModel = $ConsoleArgs[$i + 1]
            $i++
            continue
        }

        if (-not $model -and -not $arg.StartsWith('--')) {
            $model = $arg
        }
    }

    if ($model) {
        $env:AETHER_MODEL = $model
        if (-not $plannerModel) { $env:AETHER_PLANNER_MODEL = $model }
        if (-not $executorModel) { $env:AETHER_EXECUTOR_MODEL = $model }

        if (-not $provider) {
            $lowerModel = $model.ToLowerInvariant()
            $isOpenRouterModel = $lowerModel.EndsWith(':free') -or
                $lowerModel.StartsWith('openai/') -or
                $lowerModel.StartsWith('google/') -or
                $lowerModel.StartsWith('meta/') -or
                $lowerModel.StartsWith('anthropic/') -or
                $lowerModel.StartsWith('qwen/') -or
                $lowerModel.StartsWith('mistral/') -or
                $lowerModel.StartsWith('nvidia/') -or
                $lowerModel.StartsWith('poolside/') -or
                $lowerModel.StartsWith('z-ai/') -or
                $lowerModel.StartsWith('zai/')

            $isSiliconFlowModel = $lowerModel.StartsWith('deepseek-ai/') -or $lowerModel.StartsWith('deepseek-')

            if ($isOpenRouterModel) {
                $provider = 'openrouter'
            } elseif ($isSiliconFlowModel) {
                $provider = 'siliconflow'
            }
        }
    }

    if ($provider) {
        $env:AETHER_PROVIDER = $provider
    }

    if ($plannerModel) {
        $env:AETHER_PLANNER_MODEL = $plannerModel
    }

    if ($executorModel) {
        $env:AETHER_EXECUTOR_MODEL = $executorModel
    }
}

if ($null -eq $c -or $c -eq 'help') {
    Write-Host "AETHER ENGINE PRIME -- CLI MENU"
    Write-Host "--------------------------------"
    Write-Host ".\aether.ps1 boot    : Launch Sovereign Core (Legacy Binary)"
    Write-Host ".\aether.ps1 console [model] : Launch Sovereign Developer Console"
    Write-Host "  examples:"
    Write-Host "    .\aether.ps1 console openai/gpt-oss-120b:free"
    Write-Host "    .\aether.ps1 console --model openai/gpt-oss-120b:free --provider siliconflow"
    Write-Host "    .\aether.ps1 console --model google/gemma-4-31b-it:free --provider openrouter"
    Write-Host ".\aether.ps1 health  : Check Cloud Relay Health"
    Write-Host ".\aether.ps1 test    : Run Atomic Test Suite"
    Write-Host ".\aether.ps1 clean   : Purge legacy artifacts"
    exit
}

if ($c -eq 'boot') {
    Write-Host "Booting Aether Engine Prime..."
    node .\aether-boot.js @remainingArgs
}
elseif ($c -eq 'console') {
    Resolve-AetherConsoleOptions -ConsoleArgs $remainingArgs
    $env:AETHER_PLATFORM_MODE = 'developer'
    $env:AETHER_WORKSPACE_ROOT = (Get-Location).Path
    Write-Host "Opening Sovereign Developer Console..."
    if ($env:AETHER_MODEL) { Write-Host "Model: $env:AETHER_MODEL" }
    if ($env:AETHER_PROVIDER) { Write-Host "Provider: $env:AETHER_PROVIDER" }
    Write-Host "Bootstrap: MCP runtime + provider router + context engine"
    node .\package\cli.js @remainingArgs
}
elseif ($c -eq 'health') {
    Write-Host "Checking Aether Core Health..."
    node -e "require('dotenv').config(); const {RelayBridge} = require('./relay_bridge.js'); const b = new RelayBridge(); console.log(JSON.stringify(b.healthCheck(), null, 2))"
}
elseif ($c -eq 'test') {
    Write-Host "Running Sovereign Sentinel Initialization..."
    node src/core-engine/SentinelGuard.js --initialize
    Write-Host "Running Adversarial WarGaming Scan..."
    node src/security/warGamingEngine.js --scan-plan
    Write-Host "Running Decimal Purity Verification..."
    python scripts/verify_decimal_purity.py
    Write-Host "Running Security Pre-Commit Shield Check..."
    node scripts/pre_commit_secrets_shield.js
    Write-Host "Running Semantic Memory Index Curation..."
    node scripts/auto_distill_memory.js
    Write-Host "Running Core Logic Tests..."
    node test_runner.js
}
elseif ($c -eq 'clean') {
    Write-Host "Purging legacy artifacts..."
    Remove-Item test_siliconflow_adapter.js, nexus.ps1 -ErrorAction SilentlyContinue
}
else {
    Write-Host "Unknown command: $c"
}
'@
Write-Utf8NoBom -Path $aetherPath -Content $aetherContent

$report = @{
    workspaceRoot = $WorkspaceRoot
    patchedAt = (Get-Date).ToString('o')
    filesCreated = @(
        'package/dev-platform/bootstrap.js',
        'package/dev-platform/provider-router.js',
        'package/dev-platform/context-engine.js',
        'package/dev-platform/mcp-native-runtime.js'
    )
    filesModified = @(
        'package/preload.js',
        'aether.ps1'
    )
    backupRoot = $backupRoot
} | ConvertTo-Json -Depth 8

Write-Utf8NoBom -Path (Join-Path $WorkspaceRoot 'DEV_PLATFORM_PATCH_REPORT.json') -Content $report

Write-Host "Patch complete."
Write-Host "Backup folder: $backupRoot"
Write-Host "Run: .\aether.ps1 console --model openai/gpt-oss-120b:free"
