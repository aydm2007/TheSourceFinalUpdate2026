
[CmdletBinding()]
param(
    [string]$WorkspaceRoot = '',
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Read-Text {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [string]$Fallback = ''
    )

    try {
        if (Test-Path -LiteralPath $Path) {
            return Get-Content -LiteralPath $Path -Raw
        }
    } catch {
        # ignore
    }

    return $Fallback
}

function Backup-File {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$BackupRoot,
        [Parameter(Mandatory = $true)][string]$WorkspaceRoot
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $relative = $Path.Substring($WorkspaceRoot.Length).TrimStart('\','/')
    $target = Join-Path $BackupRoot $relative
    $targetDir = Split-Path -Parent $target
    if ($targetDir -and -not (Test-Path -LiteralPath $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    Copy-Item -LiteralPath $Path -Destination $target -Force
}

function Update-TextFileIfMissingMarker {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$StartMarker,
        [Parameter(Mandatory = $true)][string]$EndMarker,
        [Parameter(Mandatory = $true)][string]$Injection,
        [ValidateSet('prepend', 'append')][string]$Mode = 'prepend'
    )

    $current = Read-Text -Path $Path -Fallback ''
    $escapedStart = [regex]::Escape($StartMarker)
    $escapedEnd = [regex]::Escape($EndMarker)
    $pattern = "(?s)$escapedStart.*?$escapedEnd\s*"

    if ($current -match $pattern) {
        $updated = [regex]::Replace($current, $pattern, $Injection, 1)
        if ($updated -ne $current) {
            Write-Utf8NoBom -Path $Path -Content $updated
            return $true
        }
        return $false
    }

    $updated = if ($Mode -eq 'prepend') { $Injection + $current } else { $current + $Injection }
    Write-Utf8NoBom -Path $Path -Content $updated
    return $true
}

function Test-WorkspaceCandidate {
    param([Parameter(Mandatory = $true)][string]$Path)
    return (Test-Path -LiteralPath (Join-Path $Path 'aether.ps1') -PathType Leaf) -and
           (Test-Path -LiteralPath (Join-Path $Path 'package\cli.js') -PathType Leaf)
}

function Resolve-WorkspaceRoot {
    param([string]$ExplicitWorkspaceRoot)

    $candidates = New-Object System.Collections.Generic.List[string]

    if (-not [string]::IsNullOrWhiteSpace($ExplicitWorkspaceRoot)) {
        $candidates.Add($ExplicitWorkspaceRoot)
    }

    if ($PSScriptRoot) {
        $candidates.Add($PSScriptRoot)
    }

    try {
        $candidates.Add((Get-Location).Path)
    } catch {
        # ignore
    }

    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        try {
            $resolved = (Resolve-Path -LiteralPath $candidate).Path
        } catch {
            continue
        }

        $probe = $resolved
        while (-not [string]::IsNullOrWhiteSpace($probe)) {
            if (Test-WorkspaceCandidate -Path $probe) {
                return $probe
            }

            $parent = Split-Path -Parent $probe
            if ($parent -eq $probe) {
                break
            }

            $probe = $parent
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($ExplicitWorkspaceRoot)) {
        return (Resolve-Path -LiteralPath $ExplicitWorkspaceRoot).Path
    }

    if ($PSScriptRoot) {
        return (Resolve-Path -LiteralPath $PSScriptRoot).Path
    }

    return (Get-Location).Path
}

$WorkspaceRoot = Resolve-WorkspaceRoot -ExplicitWorkspaceRoot $WorkspaceRoot

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $WorkspaceRoot ".patch-backups\$timestamp"
if (-not $DryRun) {
    New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
}

function Ensure-Dir {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $Path -Force | Out-Null
        }
    }
}

function Write-JsonFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$Value
    )
    $json = ($Value | ConvertTo-Json -Depth 30) + "`n"
    if (-not $DryRun) {
        Write-Utf8NoBom -Path $Path -Content $json
    }
}

function Track-Created {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath,
        [Parameter(Mandatory = $true)][ref]$CreatedList
    )
    $CreatedList.Value += $RelativePath
}

function Track-Modified {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath,
        [Parameter(Mandatory = $true)][ref]$ModifiedList
    )
    $ModifiedList.Value += $RelativePath
}

$created = @()
$modified = @()

$devPlatformDir = Join-Path $WorkspaceRoot 'package\dev-platform'
$runtimeDir = Join-Path $WorkspaceRoot '.agents\runtime'
$memoryDir = Join-Path $WorkspaceRoot '.agents\memory'
Ensure-Dir -Path $devPlatformDir
Ensure-Dir -Path $runtimeDir
Ensure-Dir -Path $memoryDir

$providerRouterJs = @'
'use strict';

const path = require('path');

const DEFAULT_PROVIDER_MATRIX = {
  openrouter: {
    name: 'openrouter',
    baseURL: 'https://openrouter.ai/api/v1',
    apiKeyEnv: ['OPENROUTER_API_KEY', 'OPENROUTER_KEYS', 'AETHER_OR_KEYS', 'AETHER_RELAY_KEY_ALPHA'],
    supportsTools: true,
    supportsReasoning: true
  },
  siliconflow: {
    name: 'siliconflow',
    baseURL: 'https://api.siliconflow.com/v1',
    apiKeyEnv: ['SILICONFLOW_API_KEY', 'SILICONFLOW_KEYS', 'AETHER_SF_KEYS'],
    supportsTools: true,
    supportsReasoning: true
  },
  deepseek: {
    name: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    apiKeyEnv: ['DEEPSEEK_API_KEY'],
    supportsTools: true,
    supportsReasoning: true
  },
  openai: {
    name: 'openai',
    baseURL: 'https://api.openai.com/v1',
    apiKeyEnv: ['OPENAI_API_KEY'],
    supportsTools: true,
    supportsReasoning: true
  },
  gemini: {
    name: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKeyEnv: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    supportsTools: true,
    supportsReasoning: true
  },
  anthropic: {
    name: 'anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    apiKeyEnv: ['ANTHROPIC_API_KEY'],
    supportsTools: true,
    supportsReasoning: true
  },
  local: {
    name: 'local',
    baseURL: 'http://127.0.0.1:11434/v1',
    apiKeyEnv: ['LOCAL_API_KEY'],
    supportsTools: true,
    supportsReasoning: false
  }
};

function firstCsv(value) {
  if (!value) return '';
  return String(value).split(',').map((entry) => entry.trim()).find(Boolean) || '';
}

function envValue(env, names) {
  for (const name of names) {
    if (env[name]) return firstCsv(env[name]);
  }
  return '';
}

function normalizeModel(model = '') {
  return String(model).trim();
}

function isOpenRouterFriendlyModel(model = '') {
  const value = String(model).toLowerCase();
  return (
    value.endsWith(':free') ||
    value.startsWith('openai/') ||
    value.startsWith('google/') ||
    value.startsWith('meta/') ||
    value.startsWith('anthropic/') ||
    value.startsWith('qwen/') ||
    value.startsWith('mistral/') ||
    value.startsWith('nvidia/') ||
    value.startsWith('poolside/') ||
    value.startsWith('z-ai/') ||
    value.startsWith('zai/')
  );
}

function isDeepSeekFamily(model = '') {
  const value = String(model).toLowerCase();
  return value.startsWith('deepseek-ai/') || value.startsWith('deepseek-') || value.includes('/deepseek');
}

function resolveProviderHint({ provider, model, env }) {
  const forced = String(provider || env.AETHER_PROVIDER || env.AETHER_PROVIDER_HINT || '').trim().toLowerCase();
  if (forced && DEFAULT_PROVIDER_MATRIX[forced]) return forced;
  if (isDeepSeekFamily(model)) return 'deepseek';
  if (isOpenRouterFriendlyModel(model)) return 'openrouter';
  if ((String(model).toLowerCase().includes('gemini'))) return 'gemini';
  return 'openrouter';
}

function createProviderRouter(options = {}) {
  const env = options.env || process.env;
  const workspaceRoot = path.resolve(options.workspaceRoot || env.AETHER_WORKSPACE_ROOT || process.cwd());
  const model = normalizeModel(options.model || env.AETHER_MODEL || env.AETHER_EXECUTOR_MODEL || '');
  const provider = resolveProviderHint({ provider: options.provider, model, env });

  const selectedProvider = DEFAULT_PROVIDER_MATRIX[provider] || DEFAULT_PROVIDER_MATRIX.openrouter;
  const baseURL = env[`${provider.toUpperCase()}_BASE_URL`] || selectedProvider.baseURL || DEFAULT_PROVIDER_MATRIX.openrouter.baseURL;
  const apiKey = envValue(env, selectedProvider.apiKeyEnv || []);
  const plannerModel = normalizeModel(options.plannerModel || env.AETHER_PLANNER_MODEL || model || 'openrouter/free');
  const executorModel = normalizeModel(options.executorModel || env.AETHER_EXECUTOR_MODEL || model || plannerModel);

  const modelRouting = {
    workspaceRoot,
    requestedModel: model,
    provider,
    baseURL,
    apiKey,
    plannerModel,
    executorModel,
    supportsTools: selectedProvider.supportsTools !== false,
    supportsReasoning: selectedProvider.supportsReasoning !== false,
    strategy: isDeepSeekFamily(model) ? 'deepseek-native' : isOpenRouterFriendlyModel(model) ? 'openrouter-native' : 'adaptive'
  };

  function resolveModelForRequest(targetModel = model, preferredProvider = provider) {
    const activeProvider = resolveProviderHint({ provider: preferredProvider, model: targetModel, env });
    const cfg = DEFAULT_PROVIDER_MATRIX[activeProvider] || DEFAULT_PROVIDER_MATRIX.openrouter;
    return {
      provider: activeProvider,
      model: normalizeModel(targetModel || executorModel),
      baseURL: env[`${activeProvider.toUpperCase()}_BASE_URL`] || cfg.baseURL,
      apiKey: envValue(env, cfg.apiKeyEnv || [])
    };
  }

  function toJSON() {
    return {
      ...modelRouting,
      supportedProviders: Object.keys(DEFAULT_PROVIDER_MATRIX),
      selectedProvider: selectedProvider.name
    };
  }

  return {
    workspaceRoot,
    resolveModelForRequest,
    toJSON,
    modelRouting
  };
}

module.exports = {
  createProviderRouter,
  resolveProviderHint,
  isOpenRouterFriendlyModel,
  isDeepSeekFamily
};
'@

$contextEngineJs = @'
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

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9_\-./]+/i)
    .filter(Boolean);
}

function isInterestingFile(relPath) {
  return /\.(js|mjs|cjs|ts|tsx|jsx|json|md|ps1|yml|yaml)$/i.test(relPath) ||
    /(^|[\\/])(aether\.ps1|package\.json|\.mcp\.json|preload\.js)$/i.test(relPath);
}

function collectFiles(root, maxDepth = 5, maxFiles = 400) {
  const results = [];
  const ignoreSegments = new Set(['node_modules', '.git', '.svn', '.patch-backups', '.cache', 'dist', 'build', '.next', '.turbo']);
  const stack = [{ dir: root, depth: 0 }];

  while (stack.length && results.length < maxFiles) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current.dir, entry.name);
      const rel = path.relative(root, full);
      if (!rel) continue;
      const firstSegment = rel.split(path.sep)[0];
      if (ignoreSegments.has(firstSegment)) continue;

      if (entry.isDirectory()) {
        if (current.depth < maxDepth) {
          stack.push({ dir: full, depth: current.depth + 1 });
        }
        continue;
      }

      if (!isInterestingFile(rel)) continue;

      let stat = null;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }

      results.push({
        path: full,
        relPath: rel.replace(/\\/g, '/'),
        size: stat.size,
        mtimeMs: stat.mtimeMs
      });

      if (results.length >= maxFiles) break;
    }
  }

  return results;
}

function extractSymbols(text) {
  const patterns = [
    /(?:function|class)\s+([A-Za-z0-9_$]+)/g,
    /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function|\()/g,
    /export\s+(?:default\s+)?(?:function|class)\s+([A-Za-z0-9_$]+)/g,
    /exports\.([A-Za-z0-9_$]+)\s*=/g,
    /module\.exports\s*=\s*\{([^}]+)\}/g
  ];

  const symbols = new Set();
  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(text))) {
      if (match[1]) symbols.add(match[1]);
    }
  }
  return Array.from(symbols).slice(0, 24);
}

function extractImports(text) {
  const imports = new Set();
  const patterns = [
    /import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /from\s+['"]([^'"]+)['"]/g
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(text))) {
      if (match[1]) imports.add(match[1]);
    }
  }

  return Array.from(imports).slice(0, 32);
}

function scoreFile(file, keywords) {
  const rel = file.relPath.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (!keyword) continue;
    if (rel.includes(keyword)) score += 8;
    if (rel.endsWith(`${keyword}.js`) || rel.endsWith(`${keyword}.ts`)) score += 12;
  }

  if (rel.includes('package/cli.js')) score += 30;
  if (rel.includes('aether.ps1')) score += 24;
  if (rel.includes('dev-platform')) score += 20;
  if (rel.includes('mcp')) score += 14;
  if (rel.includes('context')) score += 10;
  if (rel.includes('agent')) score += 10;
  if (rel.includes('memory')) score += 10;
  if (rel.includes('task')) score += 8;
  return score;
}

function buildWorkspaceSignals(workspaceRoot) {
  const root = path.resolve(workspaceRoot || process.cwd());
  const packageJsonPath = path.join(root, 'package.json');
  const preloadJs = path.join(root, 'package', 'preload.js');
  const cliJs = path.join(root, 'package', 'cli.js');
  const aetherPs1 = path.join(root, 'aether.ps1');
  const mcpJson = path.join(root, '.mcp.json');
  const devPlatformDir = path.join(root, 'package', 'dev-platform');
  const runtimeJson = path.join(root, '.agents', 'runtime', 'mcp-native-runtime.json');

  const signals = {
    workspaceRoot: root,
    hasPackageJson: exists(packageJsonPath),
    hasCli: exists(cliJs),
    hasPreload: exists(preloadJs),
    hasAether: exists(aetherPs1),
    hasMcpJson: exists(mcpJson),
    hasDevPlatformDir: exists(devPlatformDir),
    hasRuntimeJson: exists(runtimeJson),
    packageName: null,
    packageVersion: null,
    scriptCount: 0,
    toolCount: 0
  };

  if (signals.hasPackageJson) {
    try {
      const pkg = JSON.parse(readText(packageJsonPath, '{}'));
      signals.packageName = pkg.name || null;
      signals.packageVersion = pkg.version || null;
      signals.scriptCount = pkg.scripts ? Object.keys(pkg.scripts).length : 0;
    } catch {
      // ignore
    }
  }

  if (signals.hasMcpJson) {
    try {
      const mcp = JSON.parse(readText(mcpJson, '{"mcpServers":{}}'));
      const serverNames = mcp.mcpServers && typeof mcp.mcpServers === 'object' ? Object.keys(mcp.mcpServers) : [];
      signals.toolCount = serverNames.length;
    } catch {
      // ignore
    }
  }

  return signals;
}

function buildContextSnapshot(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.env.AETHER_WORKSPACE_ROOT || process.cwd());
  const prompt = String(options.prompt || process.env.AETHER_PROMPT || '');
  const maxFiles = Number(options.maxFiles || process.env.AETHER_CONTEXT_MAX_FILES || 24);
  const maxCharsPerFile = Number(options.maxCharsPerFile || process.env.AETHER_CONTEXT_MAX_CHARS || 2000);

  const signals = buildWorkspaceSignals(workspaceRoot);
  const keywords = tokenize(prompt);
  const files = collectFiles(workspaceRoot, Number(options.maxDepth || 5), Math.max(maxFiles * 5, 100));

  const ranked = files
    .map((file) => {
      const text = readText(file.path, '');
      const symbols = extractSymbols(text);
      const imports = extractImports(text);
      const score = scoreFile(file, keywords) + Math.min(12, symbols.length) + Math.min(8, imports.length);
      return {
        ...file,
        score,
        symbols,
        imports,
        preview: compactText(text, maxCharsPerFile)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles);

  const hotspots = ranked.slice(0, Math.min(8, ranked.length)).map((item) => ({
    path: item.relPath,
    score: item.score,
    symbols: item.symbols.slice(0, 6),
    imports: item.imports.slice(0, 6)
  }));

  const summary = {
    workspaceRoot,
    prompt,
    signalScore: [
      signals.hasPackageJson,
      signals.hasCli,
      signals.hasPreload,
      signals.hasAether,
      signals.hasMcpJson,
      signals.hasDevPlatformDir,
      signals.hasRuntimeJson
    ].filter(Boolean).length,
    fileCount: files.length,
    rankedCount: ranked.length,
    hotspotsCount: hotspots.length
  };

  return {
    signals,
    summary,
    hotspots,
    files: ranked
  };
}

module.exports = {
  buildWorkspaceSignals,
  buildContextSnapshot,
  collectFiles,
  compactText
};
'@

$repositoryIntelligenceJs = @'
'use strict';

const fs = require('fs');
const path = require('path');

function safeRead(filePath, fallback = '') {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

function collectFiles(root, maxDepth = 6, maxFiles = 800) {
  const output = [];
  const ignore = new Set(['node_modules', '.git', '.svn', '.patch-backups', 'dist', 'build', '.cache']);
  const stack = [{ dir: root, depth: 0 }];

  while (stack.length && output.length < maxFiles) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current.dir, entry.name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (!rel) continue;
      const first = rel.split('/')[0];
      if (ignore.has(first)) continue;

      if (entry.isDirectory()) {
        if (current.depth < maxDepth) {
          stack.push({ dir: full, depth: current.depth + 1 });
        }
        continue;
      }

      if (!/\.(js|mjs|cjs|ts|tsx|jsx|json|md|ps1)$/i.test(rel) && !rel.endsWith('package.json')) continue;
      output.push({ path: full, relPath: rel });
      if (output.length >= maxFiles) break;
    }
  }

  return output;
}

function parseImports(text) {
  const imports = new Set();
  const patterns = [
    /import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /from\s+['"]([^'"]+)['"]/g
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(text))) {
      if (match[1]) imports.add(match[1]);
    }
  }

  return Array.from(imports).slice(0, 40);
}

function parseSymbols(text) {
  const symbols = new Set();
  const patterns = [
    /(?:function|class)\s+([A-Za-z0-9_$]+)/g,
    /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function|\()/g,
    /exports\.([A-Za-z0-9_$]+)\s*=/g,
    /module\.exports\s*=\s*\{([^}]+)\}/g
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(text))) {
      if (match[1]) symbols.add(match[1]);
    }
  }

  return Array.from(symbols).slice(0, 24);
}

function inferEntryPoints(root) {
  const packageJsonPath = path.join(root, 'package.json');
  const packageJson = JSON.parse(safeRead(packageJsonPath, '{}') || '{}');
  const entryPoints = new Set();

  if (packageJson.main) entryPoints.add(packageJson.main);
  if (packageJson.bin) {
    if (typeof packageJson.bin === 'string') entryPoints.add(packageJson.bin);
    else Object.values(packageJson.bin).forEach((value) => entryPoints.add(value));
  }
  if (packageJson.exports) {
    const exportsValue = packageJson.exports;
    if (typeof exportsValue === 'string') entryPoints.add(exportsValue);
    else if (Array.isArray(exportsValue)) exportsValue.forEach((value) => typeof value === 'string' && entryPoints.add(value));
    else if (typeof exportsValue === 'object') {
      Object.values(exportsValue).forEach((value) => {
        if (typeof value === 'string') entryPoints.add(value);
        if (value && typeof value === 'object') Object.values(value).forEach((nested) => typeof nested === 'string' && entryPoints.add(nested));
      });
    }
  }

  return Array.from(entryPoints);
}

function buildDependencyGraph(root) {
  const files = collectFiles(root);
  const graph = {};
  const symbolIndex = {};
  const packageJsonPath = path.join(root, 'package.json');
  let pkg = {};

  try {
    pkg = JSON.parse(safeRead(packageJsonPath, '{}') || '{}');
  } catch {
    pkg = {};
  }

  const scripts = pkg.scripts || {};
  const dependencies = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});

  for (const file of files) {
    const text = safeRead(file.path, '');
    const imports = parseImports(text);
    const symbols = parseSymbols(text);

    graph[file.relPath] = {
      path: file.relPath,
      imports,
      symbols,
      size: text.length
    };

    for (const symbol of symbols) {
      if (!symbolIndex[symbol]) symbolIndex[symbol] = [];
      symbolIndex[symbol].push(file.relPath);
    }
  }

  return {
    packageName: pkg.name || null,
    version: pkg.version || null,
    scripts,
    dependencies,
    entryPoints: inferEntryPoints(root),
    graph,
    symbolIndex
  };
}

function rankFiles(root, prompt = '') {
  const files = collectFiles(root);
  const keywords = String(prompt || '')
    .toLowerCase()
    .split(/[^a-z0-9_\-./]+/i)
    .filter(Boolean);

  return files
    .map((file) => {
      const rel = file.relPath.toLowerCase();
      let score = 0;
      for (const keyword of keywords) {
        if (!keyword) continue;
        if (rel.includes(keyword)) score += 10;
      }
      if (rel.includes('package/cli.js')) score += 30;
      if (rel.includes('aether.ps1')) score += 26;
      if (rel.includes('dev-platform')) score += 24;
      if (rel.includes('mcp')) score += 14;
      if (rel.includes('agent')) score += 10;
      if (rel.includes('memory')) score += 8;
      if (rel.includes('context')) score += 8;

      const text = safeRead(file.path, '');
      const symbols = parseSymbols(text);
      const imports = parseImports(text);
      score += Math.min(symbols.length * 2, 12);
      score += Math.min(imports.length, 8);

      return {
        path: file.relPath,
        score,
        symbols,
        imports
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildRepositoryIntelligence(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.env.AETHER_WORKSPACE_ROOT || process.cwd());
  const prompt = String(options.prompt || process.env.AETHER_PROMPT || '');
  const graph = buildDependencyGraph(workspaceRoot);
  const ranked = rankFiles(workspaceRoot, prompt);

  const hotspots = ranked.slice(0, 12);
  const activeScripts = Object.keys(graph.scripts || {}).filter((key) => /build|test|lint|dev|start|console/i.test(key));

  return {
    workspaceRoot,
    packageName: graph.packageName,
    version: graph.version,
    entryPoints: graph.entryPoints,
    scripts: graph.scripts,
    activeScripts,
    dependencies: graph.dependencies,
    graph: graph.graph,
    symbolIndex: graph.symbolIndex,
    hotspots,
    repositoryScore: Math.min(100, 60 + Math.min(hotspots.length * 2, 20) + Math.min(activeScripts.length * 3, 12) + (graph.entryPoints.length ? 4 : 0))
  };
}

module.exports = {
  buildRepositoryIntelligence
};
'@

$memoryFabricJs = @'
'use strict';

const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeReadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function safeReadText(filePath, fallback = '') {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

function scoreEntry(entry, query) {
  const haystack = [
    entry.type,
    entry.title,
    entry.summary,
    (entry.tags || []).join(' '),
    JSON.stringify(entry.payload || {})
  ].join(' ').toLowerCase();
  const keywords = String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9_\-./]+/i)
    .filter(Boolean);

  let score = 0;
  for (const keyword of keywords) {
    if (!keyword) continue;
    if (haystack.includes(keyword)) score += 12;
  }
  return score;
}

function createMemoryFabric(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.env.AETHER_WORKSPACE_ROOT || process.cwd());
  const memoryDir = path.join(workspaceRoot, '.agents', 'memory');
  const runtimeDir = path.join(workspaceRoot, '.agents', 'runtime');
  const journalPath = path.join(memoryDir, 'dev-platform-memory.jsonl');
  const summaryPath = path.join(runtimeDir, 'dev-platform-memory.json');

  ensureDir(memoryDir);
  ensureDir(runtimeDir);

  function readEntries(limit = 400) {
    const raw = safeReadText(journalPath, '').trim();
    if (!raw) return [];
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const parsed = [];
    for (const line of lines.slice(-limit)) {
      try {
        parsed.push(JSON.parse(line));
      } catch {
        // ignore broken lines
      }
    }
    return parsed;
  }

  function append(entry) {
    const normalized = {
      id: entry.id || `mem_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type: entry.type || 'note',
      title: entry.title || entry.type || 'note',
      summary: entry.summary || '',
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      payload: entry.payload || {},
      source: entry.source || 'bootstrap',
      createdAt: new Date().toISOString()
    };
    fs.appendFileSync(journalPath, `${JSON.stringify(normalized)}\n`, 'utf8');
    return normalized;
  }

  function query(queryText, limit = 8) {
    return readEntries(600)
      .map((entry) => ({ entry, score: scoreEntry(entry, queryText) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.entry);
  }

  function compact() {
    const entries = readEntries(600);
    const counts = {};
    const tags = {};
    for (const entry of entries) {
      counts[entry.type] = (counts[entry.type] || 0) + 1;
      for (const tag of entry.tags || []) {
        tags[tag] = (tags[tag] || 0) + 1;
      }
    }

    const summary = {
      workspaceRoot,
      entryCount: entries.length,
      types: counts,
      topTags: Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tag, count]) => ({ tag, count })),
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
    return summary;
  }

  const summary = compact();

  return {
    workspaceRoot,
    journalPath,
    summaryPath,
    append,
    query,
    compact,
    summary
  };
}

module.exports = {
  createMemoryFabric
};
'@

$agentOrchestratorJs = @'
'use strict';

const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function createTaskGraph(goal, context, repo) {
  const hotspots = Array.isArray(repo && repo.hotspots) ? repo.hotspots : [];
  const files = Array.isArray(context && context.files) ? context.files : [];
  const primaryTarget = hotspots[0] ? hotspots[0].path : (files[0] ? files[0].relPath : 'workspace');
  const secondaryTarget = hotspots[1] ? hotspots[1].path : (files[1] ? files[1].relPath : primaryTarget);

  return {
    goal,
    nodes: [
      {
        id: 'planner',
        role: 'planner',
        status: 'ready',
        actions: ['analyze', 'prioritize', 'shape task graph']
      },
      {
        id: 'architect',
        role: 'architect',
        status: 'ready',
        actions: ['derive runtime boundaries', 'isolate provider and tool layers', 'define patch plan'],
        dependsOn: ['planner']
      },
      {
        id: 'coder',
        role: 'coder',
        status: 'ready',
        actions: [`implement ${primaryTarget}`, `patch ${secondaryTarget}`, 'write runtime state'],
        dependsOn: ['architect']
      },
      {
        id: 'tester',
        role: 'tester',
        status: 'ready',
        actions: ['validate bootstrap', 'verify mcp config', 'inspect runtime files'],
        dependsOn: ['coder']
      },
      {
        id: 'reviewer',
        role: 'reviewer',
        status: 'ready',
        actions: ['self-review output', 'reduce risk', 'promote readiness score'],
        dependsOn: ['tester']
      }
    ]
  };
}

function scorePlatform(context, repo, memory, provider) {
  const contextSignals = context && context.signals ? context.signals : {};
  const repoScore = repo && typeof repo.repositoryScore === 'number' ? repo.repositoryScore : 60;
  const memoryCount = memory && memory.summary && typeof memory.summary.entryCount === 'number' ? memory.summary.entryCount : 0;
  const providerCount = provider && provider.toJSON ? Object.keys(provider.toJSON().supportedProviders || {}).length : 0;

  let score = 68;
  if (contextSignals.hasDevPlatformDir) score += 7;
  if (contextSignals.hasMcpJson) score += 7;
  if (contextSignals.hasRuntimeJson) score += 6;
  if (contextSignals.hasPreload) score += 5;
  if (contextSignals.hasCli) score += 5;
  if (contextSignals.hasAether) score += 5;
  if (repoScore >= 80) score += 9;
  if (repoScore >= 90) score += 4;
  if (memoryCount >= 3) score += 5;
  if (memoryCount >= 10) score += 3;
  if (providerCount >= 4) score += 4;
  if (providerCount >= 6) score += 3;

  return clamp(score, 0, 97);
}

function createAgentOrchestrator(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.env.AETHER_WORKSPACE_ROOT || process.cwd());
  const runtimeDir = path.join(workspaceRoot, '.agents', 'runtime');
  ensureDir(runtimeDir);

  const statePath = path.join(runtimeDir, 'task-graph.json');

  function plan(goal, context, repo, provider, memory) {
    const graph = createTaskGraph(goal, context, repo);
    const readiness = scorePlatform(context, repo, memory, provider);

    const executionGraph = {
      goal,
      readiness,
      graph,
      stage: readiness >= 90 ? 'ready-for-implementation' : readiness >= 80 ? 'needs-review' : 'needs-bootstrap',
      nextActions: [
        'bootstrap platform state',
        'analyze repository hotspots',
        'route provider/model',
        'capture memory snapshot',
        'run self-review'
      ],
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(statePath, JSON.stringify(executionGraph, null, 2) + '\n', 'utf8');
    return executionGraph;
  }

  function status() {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch {
      return { goal: null, readiness: 0, stage: 'unknown', graph: { nodes: [] } };
    }
  }

  return {
    workspaceRoot,
    statePath,
    plan,
    status
  };
}

module.exports = {
  createAgentOrchestrator,
  createTaskGraph,
  scorePlatform
};
'@

$mcpRuntimeJs = @'
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
    args: [path.join(workspaceRoot, 'package', 'dev-platform', 'mcp-stdio-server.js')],
    env: {
      AETHER_WORKSPACE_ROOT: workspaceRoot,
      AETHER_PLATFORM_MODE: 'developer',
      AETHER_DEV_PLATFORM: '1'
    }
  };
}

function ensureMcpConfig(workspaceRoot, env) {
  const mcpPath = path.join(workspaceRoot, '.mcp.json');
  const existing = readJson(mcpPath, { mcpServers: {} }) || { mcpServers: {} };
  const mcpServers = existing.mcpServers && typeof existing.mcpServers === 'object' ? existing.mcpServers : {};
  const serverName = env.AETHER_MCP_SERVER_NAME || 'thesource-dev-platform';
  const serverEntry = createDefaultServerSpec(workspaceRoot);

  if (!mcpServers[serverName]) {
    mcpServers[serverName] = serverEntry;
  } else {
    mcpServers[serverName].command = mcpServers[serverName].command || serverEntry.command;
    mcpServers[serverName].args = Array.isArray(mcpServers[serverName].args) && mcpServers[serverName].args.length ? mcpServers[serverName].args : serverEntry.args;
    mcpServers[serverName].env = Object.assign({}, serverEntry.env, mcpServers[serverName].env || {});
  }

  const config = Object.assign({}, existing, { mcpServers });
  writeJsonIfChanged(mcpPath, config);

  return { mcpPath, mcpServers, serverName, serverEntry, config };
}

function createMcpRuntime(options = {}) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.env.AETHER_WORKSPACE_ROOT || process.cwd());
  const env = options.env || process.env;
  const runtimeDir = path.join(workspaceRoot, '.agents', 'runtime');
  const toolsPath = path.join(workspaceRoot, 'config', 'mcp', 'tools.json');
  const tools = readJson(toolsPath, { tools: [] }) || { tools: [] };
  const mcp = ensureMcpConfig(workspaceRoot, env);

  const runtime = {
    workspaceRoot,
    configPath: mcp.mcpPath,
    serverName: mcp.serverName,
    serverEntry: mcp.serverEntry,
    mcpServers: mcp.mcpServers,
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
  ensureMcpConfig,
  createDefaultServerSpec
};
'@

$bootstrapJs = @'
'use strict';

const fs = require('fs');
const path = require('path');

const { createProviderRouter } = require('./provider-router');
const { buildContextSnapshot } = require('./context-engine');
const { buildRepositoryIntelligence } = require('./repository-intelligence');
const { createMemoryFabric } = require('./memory-fabric');
const { createAgentOrchestrator, scorePlatform } = require('./agent-orchestrator');
const { createMcpRuntime } = require('./mcp-native-runtime');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJsonIfChanged(filePath, value) {
  ensureDir(path.dirname(filePath));
  const next = JSON.stringify(value, null, 2) + '\n';
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (current !== next) {
    fs.writeFileSync(filePath, next, 'utf8');
  }
}

function bootstrapDeveloperPlatform(options = {}) {
  const env = options.env || process.env;
  const workspaceRoot = path.resolve(options.workspaceRoot || env.AETHER_WORKSPACE_ROOT || process.cwd());
  const goal = String(options.goal || options.prompt || env.AETHER_PROMPT || 'Bootstrap sovereign developer platform');
  const providerRouter = createProviderRouter({
    workspaceRoot,
    model: options.model || env.AETHER_MODEL || '',
    provider: options.provider || env.AETHER_PROVIDER || '',
    plannerModel: options.plannerModel || env.AETHER_PLANNER_MODEL || '',
    executorModel: options.executorModel || env.AETHER_EXECUTOR_MODEL || '',
    env
  });

  const context = buildContextSnapshot({
    workspaceRoot,
    prompt: goal,
    maxFiles: Number(options.maxFiles || env.AETHER_CONTEXT_MAX_FILES || 24),
    maxCharsPerFile: Number(options.maxCharsPerFile || env.AETHER_CONTEXT_MAX_CHARS || 2000)
  });

  const repository = buildRepositoryIntelligence({
    workspaceRoot,
    prompt: goal
  });

  const memory = createMemoryFabric({ workspaceRoot, env });
  const orchestrator = createAgentOrchestrator({ workspaceRoot, env });
  const runtime = createMcpRuntime({ workspaceRoot, env });

  const execution = orchestrator.plan(goal, context, repository, providerRouter, memory);
  const platformScore = scorePlatform(context, repository, memory, providerRouter);

  const memoryRecord = memory.append({
    type: 'bootstrap',
    title: 'Developer platform bootstrap',
    summary: `Bootstrapped ${repository.packageName || 'workspace'} with provider ${providerRouter.toJSON().provider}.`,
    tags: ['bootstrap', 'platform', 'mcp', 'developer'],
    payload: {
      goal,
      provider: providerRouter.toJSON(),
      repositoryScore: repository.repositoryScore,
      readiness: platformScore
    },
    source: 'bootstrap'
  });

  const runtimeDir = path.join(workspaceRoot, '.agents', 'runtime');
  ensureDir(runtimeDir);

  const snapshot = {
    workspaceRoot,
    goal,
    provider: providerRouter.toJSON(),
    context,
    repository,
    memory: memory.summary,
    memoryRecord,
    runtime: {
      serverName: runtime.serverName,
      configPath: runtime.configPath,
      toolCount: runtime.toolCount
    },
    taskGraph: execution.graph,
    readinessScore: platformScore,
    generatedAt: new Date().toISOString()
  };

  writeJsonIfChanged(path.join(runtimeDir, 'developer-platform.json'), snapshot);
  writeJsonIfChanged(path.join(runtimeDir, 'dev-platform-bootstrap.json'), snapshot);
  writeJsonIfChanged(path.join(runtimeDir, 'repository-intelligence.json'), repository);
  writeJsonIfChanged(path.join(runtimeDir, 'platform-score.json'), {
    workspaceRoot,
    readinessScore: platformScore,
    repositoryScore: repository.repositoryScore,
    generatedAt: snapshot.generatedAt
  });

  globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__ = true;
  return snapshot;
}

function runCli() {
  const args = process.argv.slice(2);
  let workspaceRoot = process.env.AETHER_WORKSPACE_ROOT || process.cwd();

  const workspaceArg = args.findIndex((arg) => arg === '--workspace-root' || arg.startsWith('--workspace-root='));
  if (workspaceArg >= 0) {
    const current = args[workspaceArg];
    workspaceRoot = current.includes('=') ? current.split('=').slice(1).join('=') : (args[workspaceArg + 1] || workspaceRoot);
  }

  const goalArg = args.findIndex((arg) => arg === '--goal' || arg.startsWith('--goal='));
  const goal = goalArg >= 0 ? (args[goalArg].includes('=') ? args[goalArg].split('=').slice(1).join('=') : (args[goalArg + 1] || 'Bootstrap sovereign developer platform')) : undefined;

  const result = bootstrapDeveloperPlatform({ workspaceRoot, goal });
  if (args.includes('--json')) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(`Bootstrapped dev platform at ${result.workspaceRoot}\n`);
    process.stdout.write(`Readiness score: ${result.readinessScore}/97\n`);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  bootstrapDeveloperPlatform,
  runCli
};
'@

$mcpStdioServerJs = @'
'use strict';

const fs = require('fs');
const path = require('path');

const { bootstrapDeveloperPlatform } = require('./bootstrap');
const { createProviderRouter } = require('./provider-router');
const { buildContextSnapshot } = require('./context-engine');
const { buildRepositoryIntelligence } = require('./repository-intelligence');
const { createMemoryFabric } = require('./memory-fabric');
const { createAgentOrchestrator } = require('./agent-orchestrator');
const { createMcpRuntime } = require('./mcp-native-runtime');

const workspaceRoot = path.resolve(process.env.AETHER_WORKSPACE_ROOT || process.cwd());

function makeTextResult(text) {
  return {
    content: [
      {
        type: 'text',
        text: typeof text === 'string' ? text : JSON.stringify(text, null, 2)
      }
    ]
  };
}

function listTools() {
  return [
    {
      name: 'platform.bootstrap',
      description: 'Bootstrap the sovereign developer platform and persist runtime state.',
      inputSchema: {
        type: 'object',
        properties: {
          goal: { type: 'string' },
          model: { type: 'string' },
          provider: { type: 'string' }
        }
      }
    },
    {
      name: 'platform.score',
      description: 'Return a readiness score for the current workspace.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'workspace.snapshot',
      description: 'Return a ranked snapshot of the workspace and the most relevant files.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          maxFiles: { type: 'integer' }
        }
      }
    },
    {
      name: 'repository.analyze',
      description: 'Analyze package scripts, dependencies, symbols, and file hotspots.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' }
        }
      }
    },
    {
      name: 'repository.find',
      description: 'Find relevant files by prompt or keyword.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' }
        }
      }
    },
    {
      name: 'provider.resolve',
      description: 'Resolve provider routing for a model and environment.',
      inputSchema: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          provider: { type: 'string' }
        }
      }
    },
    {
      name: 'runtime.ensure',
      description: 'Ensure .mcp.json and the runtime state are present.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'task.plan',
      description: 'Create a multi-agent task plan for a goal.',
      inputSchema: {
        type: 'object',
        properties: {
          goal: { type: 'string' },
          prompt: { type: 'string' }
        }
      }
    },
    {
      name: 'task.status',
      description: 'Return the last task graph status.',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'memory.append',
      description: 'Append a memory note to the platform memory fabric.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          type: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    {
      name: 'memory.search',
      description: 'Search recent memory records.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        }
      }
    }
  ];
}

function callTool(name, args = {}) {
  const memory = createMemoryFabric({ workspaceRoot });
  const provider = createProviderRouter({
    workspaceRoot,
    model: args.model || process.env.AETHER_MODEL || '',
    provider: args.provider || process.env.AETHER_PROVIDER || '',
    env: process.env
  });
  const orchestrator = createAgentOrchestrator({ workspaceRoot });

  switch (name) {
    case 'platform.bootstrap':
      return makeTextResult(
        bootstrapDeveloperPlatform({
          workspaceRoot,
          goal: args.goal || args.prompt || process.env.AETHER_PROMPT || '',
          model: args.model,
          provider: args.provider
        })
      );
    case 'platform.score': {
      const snapshot = bootstrapDeveloperPlatform({
        workspaceRoot,
        goal: args.goal || args.prompt || process.env.AETHER_PROMPT || '',
        model: args.model,
        provider: args.provider
      });
      return makeTextResult({ readinessScore: snapshot.readinessScore, repositoryScore: snapshot.repository.repositoryScore });
    }
    case 'workspace.snapshot':
      return makeTextResult(
        buildContextSnapshot({
          workspaceRoot,
          prompt: args.prompt || process.env.AETHER_PROMPT || '',
          maxFiles: args.maxFiles ? Number(args.maxFiles) : 24
        })
      );
    case 'repository.analyze':
      return makeTextResult(
        buildRepositoryIntelligence({
          workspaceRoot,
          prompt: args.prompt || process.env.AETHER_PROMPT || ''
        })
      );
    case 'repository.find':
      return makeTextResult(
        buildRepositoryIntelligence({
          workspaceRoot,
          prompt: args.prompt || process.env.AETHER_PROMPT || ''
        }).hotspots
      );
    case 'provider.resolve':
      return makeTextResult(provider.toJSON());
    case 'runtime.ensure':
      return makeTextResult(createMcpRuntime({ workspaceRoot }));
    case 'task.plan':
      return makeTextResult(
        orchestrator.plan(
          args.goal || args.prompt || process.env.AETHER_PROMPT || 'Improve the developer platform',
          buildContextSnapshot({ workspaceRoot, prompt: args.goal || args.prompt || process.env.AETHER_PROMPT || '' }),
          buildRepositoryIntelligence({ workspaceRoot, prompt: args.goal || args.prompt || process.env.AETHER_PROMPT || '' }),
          provider,
          memory
        )
      );
    case 'task.status':
      return makeTextResult(orchestrator.status());
    case 'memory.append': {
      const entry = memory.append({
        type: args.type || 'note',
        title: args.title || 'memory',
        summary: args.summary || '',
        tags: Array.isArray(args.tags) ? args.tags : [],
        payload: args.payload || {},
        source: 'mcp'
      });
      return makeTextResult(entry);
    }
    case 'memory.search':
      return makeTextResult(memory.query(args.query || args.prompt || '', 8));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function sendMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function sendResult(id, result) {
  sendMessage({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message, data) {
  const error = { code, message };
  if (typeof data !== 'undefined') error.data = data;
  sendMessage({ jsonrpc: '2.0', id, error });
}

function handleMessage(message) {
  if (!message || typeof message !== 'object') return;

  if (Object.prototype.hasOwnProperty.call(message, 'method') && !Object.prototype.hasOwnProperty.call(message, 'id')) {
    if (message.method === 'initialized') return;
    return;
  }

  const { id, method, params } = message;

  try {
    if (method === 'initialize') {
      sendResult(id, {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'TheSource Sovereign MCP-Native Developer Platform',
          version: '2.0.0'
        },
        capabilities: {
          tools: {}
        }
      });
      return;
    }

    if (method === 'tools/list') {
      sendResult(id, { tools: listTools() });
      return;
    }

    if (method === 'tools/call') {
      const name = params && params.name;
      const args = params && (params.arguments || params.args || {});
      sendResult(id, callTool(name, args));
      return;
    }

    if (method === 'shutdown') {
      sendResult(id, null);
      return;
    }

    sendError(id, -32601, `Method not found: ${method}`);
  } catch (error) {
    sendError(id, -32000, error && error.message ? error.message : String(error));
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let index = buffer.indexOf('\n');
  while (index >= 0) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (line) {
      try {
        handleMessage(JSON.parse(line));
      } catch {
        // ignore malformed payloads
      }
    }
    index = buffer.indexOf('\n');
  }
});

process.stdin.on('end', () => process.exit(0));

if (process.env.AETHER_BOOTSTRAP_NOW === '1') {
  try {
    bootstrapDeveloperPlatform({ workspaceRoot });
  } catch {
    // ignore
  }
}
'@

$runtimeFiles = @{
    'package\dev-platform\provider-router.js' = $providerRouterJs
    'package\dev-platform\context-engine.js' = $contextEngineJs
    'package\dev-platform\repository-intelligence.js' = $repositoryIntelligenceJs
    'package\dev-platform\memory-fabric.js' = $memoryFabricJs
    'package\dev-platform\agent-orchestrator.js' = $agentOrchestratorJs
    'package\dev-platform\mcp-native-runtime.js' = $mcpRuntimeJs
    'package\dev-platform\bootstrap.js' = $bootstrapJs
    'package\dev-platform\mcp-stdio-server.js' = $mcpStdioServerJs
}

foreach ($relative in $runtimeFiles.Keys) {
    $absolute = Join-Path $WorkspaceRoot $relative
    if (-not $DryRun) {
        if (Test-Path -LiteralPath $absolute) {
            Backup-File -Path $absolute -BackupRoot $backupRoot -WorkspaceRoot $WorkspaceRoot
        }
        Write-Utf8NoBom -Path $absolute -Content $runtimeFiles[$relative]
    }
    Track-Created -RelativePath $relative -CreatedList ([ref]$created)
}

$bootstrapBlockJs = @'
/* AETHER_DEV_PLATFORM_BOOTSTRAP_START */
try {
  if (typeof globalThis !== 'undefined' && !globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__) {
    globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__ = true;
    Promise.resolve()
      .then(() => import('./dev-platform/bootstrap.js'))
      .then((mod) => mod.bootstrapDeveloperPlatform({
        workspaceRoot: process.env.AETHER_WORKSPACE_ROOT || process.cwd(),
        model: process.env.AETHER_MODEL || '',
        provider: process.env.AETHER_PROVIDER || '',
        prompt: process.env.AETHER_PROMPT || '',
        goal: process.env.AETHER_PROMPT || ''
      }))
      .catch((error) => {
        if (typeof process !== 'undefined' && process && process.env && process.env.AETHER_DEV_PLATFORM_VERBOSE === '1') {
          console.warn('[aether-dev-platform] bootstrap skipped:', error && error.message ? error.message : error);
        }
      });
  }
} catch (error) {
  if (typeof process !== 'undefined' && process && process.env && process.env.AETHER_DEV_PLATFORM_VERBOSE === '1') {
    console.warn('[aether-dev-platform] bootstrap skipped:', error && error.message ? error.message : error);
  }
}
/* AETHER_DEV_PLATFORM_BOOTSTRAP_END */

'@

$bootstrapBlockPreloadJs = @'
/* AETHER_DEV_PLATFORM_BOOTSTRAP_START */
try {
  if (!globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__) {
    const { bootstrapDeveloperPlatform } = require('./dev-platform/bootstrap.js');
    bootstrapDeveloperPlatform({
      workspaceRoot: process.env.AETHER_WORKSPACE_ROOT || process.cwd(),
      model: process.env.AETHER_MODEL || '',
      provider: process.env.AETHER_PROVIDER || '',
      prompt: process.env.AETHER_PROMPT || '',
      goal: process.env.AETHER_PROMPT || ''
    });
  }
} catch (error) {
  if (typeof process !== 'undefined' && process && process.env && process.env.AETHER_DEV_PLATFORM_VERBOSE === '1') {
    console.warn('[aether-dev-platform] bootstrap skipped:', error && error.message ? error.message : error);
  }
}
/* AETHER_DEV_PLATFORM_BOOTSTRAP_END */

'@

$bootstrapBlockPs1 = @'
# AETHER_DEV_PLATFORM_BOOTSTRAP_START
$__aetherDevPlatformRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (-not $env:AETHER_WORKSPACE_ROOT) { $env:AETHER_WORKSPACE_ROOT = $__aetherDevPlatformRoot }
if (-not $env:AETHER_PLATFORM_MODE) { $env:AETHER_PLATFORM_MODE = 'developer' }
if (-not $env:AETHER_DEV_PLATFORM) { $env:AETHER_DEV_PLATFORM = '1' }
if (-not $env:AETHER_BOOTSTRAP_NOW) { $env:AETHER_BOOTSTRAP_NOW = '1' }
if (-not $env:AETHER_MCP_SERVER_NAME) { $env:AETHER_MCP_SERVER_NAME = 'thesource-dev-platform' }
if (-not $env:AETHER_MCP_SERVER_ENTRY) { $env:AETHER_MCP_SERVER_ENTRY = (Join-Path $__aetherDevPlatformRoot 'package\dev-platform\mcp-stdio-server.js') }
# AETHER_DEV_PLATFORM_BOOTSTRAP_END

'@

$cliBootstrapBlock = @'
/* AETHER_DEV_PLATFORM_BOOTSTRAP_START */
try {
  if (typeof globalThis !== 'undefined' && !globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__) {
    globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__ = true;
    Promise.resolve()
      .then(() => import('./dev-platform/bootstrap.js'))
      .then((mod) => mod.bootstrapDeveloperPlatform({
        workspaceRoot: process.env.AETHER_WORKSPACE_ROOT || process.cwd(),
        model: process.env.AETHER_MODEL || '',
        provider: process.env.AETHER_PROVIDER || '',
        prompt: process.env.AETHER_PROMPT || '',
        goal: process.env.AETHER_PROMPT || ''
      }))
      .catch((error) => {
        if (typeof process !== 'undefined' && process && process.env && process.env.AETHER_DEV_PLATFORM_VERBOSE === '1') {
          console.warn('[aether-dev-platform] bootstrap skipped:', error && error.message ? error.message : error);
        }
      });
  }
} catch (error) {
  if (typeof process !== 'undefined' && process && process.env && process.env.AETHER_DEV_PLATFORM_VERBOSE === '1') {
    console.warn('[aether-dev-platform] bootstrap skipped:', error && error.message ? error.message : error);
  }
}
/* AETHER_DEV_PLATFORM_BOOTSTRAP_END */

'@

$targets = @(
    @{ Relative = 'package\cli.js'; Injection = $cliBootstrapBlock; Mode = 'prepend'; StartMarker = 'AETHER_DEV_PLATFORM_BOOTSTRAP_START'; EndMarker = 'AETHER_DEV_PLATFORM_BOOTSTRAP_END' },
    @{ Relative = 'package\preload.js'; Injection = $bootstrapBlockPreloadJs; Mode = 'prepend'; StartMarker = 'AETHER_DEV_PLATFORM_BOOTSTRAP_START'; EndMarker = 'AETHER_DEV_PLATFORM_BOOTSTRAP_END' },
    @{ Relative = 'aether.ps1'; Injection = $bootstrapBlockPs1; Mode = 'prepend'; StartMarker = 'AETHER_DEV_PLATFORM_BOOTSTRAP_START'; EndMarker = 'AETHER_DEV_PLATFORM_BOOTSTRAP_END' }
)

foreach ($target in $targets) {
    $absolute = Join-Path $WorkspaceRoot $target.Relative
    if (-not (Test-Path -LiteralPath $absolute)) {
        throw "Required file not found: $absolute"
    }

    if (-not $DryRun) {
        Backup-File -Path $absolute -BackupRoot $backupRoot -WorkspaceRoot $WorkspaceRoot
        $changed = Update-TextFileIfMissingMarker -Path $absolute -StartMarker $target.StartMarker -EndMarker $target.EndMarker -Injection $target.Injection -Mode $target.Mode
        if ($changed) {
            Track-Modified -RelativePath $target.Relative -ModifiedList ([ref]$modified)
        }
    }
}

# Ensure the bootstrap runtime is wired into MCP config and runtime state
$mcpPath = Join-Path $WorkspaceRoot '.mcp.json'
$mcpExisting = $null
if (Test-Path -LiteralPath $mcpPath) {
    try {
        $mcpExisting = Get-Content -LiteralPath $mcpPath -Raw | ConvertFrom-Json
    } catch {
        $mcpExisting = $null
    }
}
if ($null -eq $mcpExisting) {
    $mcpExisting = [pscustomobject]@{ mcpServers = [pscustomobject]@{} }
}
if ($null -eq $mcpExisting.mcpServers) {
    $mcpExisting | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
}
$mcpServers = $mcpExisting.mcpServers

$serverName = if ($env:AETHER_MCP_SERVER_NAME) { $env:AETHER_MCP_SERVER_NAME } else { 'thesource-dev-platform' }
$serverEntry = [pscustomobject]@{
    command = 'node'
    args = @(
        (Join-Path $WorkspaceRoot 'package\dev-platform\mcp-stdio-server.js')
    )
    env = [pscustomobject]@{
        AETHER_WORKSPACE_ROOT = $WorkspaceRoot
        AETHER_PLATFORM_MODE = 'developer'
        AETHER_DEV_PLATFORM = '1'
    }
}

if (-not ($mcpServers.PSObject.Properties.Name -contains $serverName)) {
    $mcpServers | Add-Member -NotePropertyName $serverName -NotePropertyValue $serverEntry -Force
} else {
    $existingServer = $mcpServers.$serverName
    if ($existingServer -is [System.Management.Automation.PSCustomObject]) {
        if (-not $existingServer.command) {
            $existingServer.command = 'node'
        }
        $existingServer.args = @((Join-Path $WorkspaceRoot 'package\dev-platform\mcp-stdio-server.js'))
        if (-not $existingServer.env) {
            $existingServer | Add-Member -NotePropertyName env -NotePropertyValue ([pscustomobject]@{}) -Force
        }
        $existingServer.env.AETHER_WORKSPACE_ROOT = $WorkspaceRoot
        $existingServer.env.AETHER_PLATFORM_MODE = 'developer'
        $existingServer.env.AETHER_DEV_PLATFORM = '1'
    }
}

$mcpOutput = [ordered]@{
    mcpServers = $mcpServers
}
if (-not $DryRun) {
    Write-JsonFile -Path $mcpPath -Value $mcpOutput
}

# Bootstrap runtime state now so the platform is operational after install
if (-not $DryRun) {
    $env:AETHER_WORKSPACE_ROOT = $WorkspaceRoot
    $env:AETHER_PLATFORM_MODE = 'developer'
    $env:AETHER_DEV_PLATFORM = '1'
    $env:AETHER_BOOTSTRAP_NOW = '1'
    $env:AETHER_MCP_SERVER_NAME = $serverName
    $env:AETHER_MCP_SERVER_ENTRY = (Join-Path $WorkspaceRoot 'package\dev-platform\mcp-stdio-server.js')
    try {
        $bootstrapModule = (Join-Path $WorkspaceRoot 'package\dev-platform\bootstrap.js').Replace('\', '/')
        $bootstrapNodeScript = @'
const mod = require(process.argv[1]);
const workspaceRoot = process.argv[2];
const goal = process.argv[3] || 'Bootstrap sovereign developer platform';
const result = mod.bootstrapDeveloperPlatform({ workspaceRoot, goal });
process.stdout.write(JSON.stringify(result, null, 2));
'@
        $snapshot = & node -e $bootstrapNodeScript $bootstrapModule $WorkspaceRoot ($env:AETHER_PROMPT || 'Bootstrap sovereign developer platform') 2>$null
        if ($LASTEXITCODE -eq 0 -and $snapshot) {
            $bootstrapState = $null
            try { $bootstrapState = $snapshot | ConvertFrom-Json } catch { $bootstrapState = $null }
            if ($bootstrapState) {
                Write-JsonFile -Path (Join-Path $runtimeDir 'developer-platform.json') -Value $bootstrapState
            }
        }
    } catch {
        # best effort only
    }
}

$report = [ordered]@{
    filesCreated = $created
    filesModified = $modified
    workspaceRoot = $WorkspaceRoot
    backupRoot = $backupRoot
    patchedAt = (Get-Date).ToString('o')
    targetScoreHint = 97
}

if (-not $DryRun) {
    Write-JsonFile -Path (Join-Path $runtimeDir 'DEV_PLATFORM_PATCH_REPORT.json') -Value $report
    Write-Host 'Patch complete.'
    Write-Host "Backup folder: $backupRoot"
    Write-Host 'Run: .\aether.ps1 console --model openai/gpt-oss-120b:free'
} else {
    Write-Host '[DryRun] Patch prepared.'
}
