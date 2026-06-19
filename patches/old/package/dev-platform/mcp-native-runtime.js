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
