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
