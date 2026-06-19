#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const workspaceRoot = path.resolve(__dirname, '..');
const bridgePath = path.join(workspaceRoot, 'bridge.json');
const cliPath = path.join(workspaceRoot, 'package', 'cli.js');
const mapPath = path.join(workspaceRoot, 'package', 'cli.js.map');
const ledgerPath = path.join(workspaceRoot, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
const shouldLog = !process.argv.includes('--no-ledger');

const scanTargets = [
  'nexus_bridge.js',
  'mcp_bridge_server.js',
  'mcp_remote_server.js',
  'core',
  'scripts',
  'tests',
  '.agents/skills',
  'AGENTS.md',
  'package.json',
];

const excludedDirs = new Set([
  '.git',
  '.nexus',
  'node_modules',
  'reports',
  'package',
  'worktree',
]);

const textFilePattern = /\.(js|cjs|mjs|ts|tsx|json|md|ps1|cmd)$/i;

function now() {
  return new Date().toISOString();
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function relative(filePath) {
  return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineColumnFromIndex(text, index) {
  const prefix = text.slice(0, Math.max(0, index));
  const lines = prefix.split(/\r\n|\r|\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function walkFiles(target, output = []) {
  if (!fs.existsSync(target)) return output;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      if (excludedDirs.has(entry)) continue;
      walkFiles(path.join(target, entry), output);
    }
    return output;
  }
  if (textFilePattern.test(target)) output.push(target);
  return output;
}

function sourceKind(filePath) {
  const rel = relative(filePath);
  if (/^(nexus_bridge|mcp_.*server)\.js$/.test(rel) || rel.startsWith('core/')) return 'runtime';
  if (rel.startsWith('scripts/')) return 'verifier';
  if (rel.startsWith('tests/')) return 'test';
  if (rel.startsWith('.agents/skills/') || rel === 'AGENTS.md') return 'governance';
  return 'project';
}

function sourceMapKind(source) {
  if (!source) return 'unknown';
  if (source.includes('node_modules/')) return 'dependency';
  if (source.includes('/src/') || source.startsWith('../src/')) return 'first-party';
  return 'bundled';
}

function firstProjectAnchor(toolName, files) {
  const pattern = new RegExp(`\\b${escapeRegex(toolName)}\\b`);
  let fallback = null;

  for (const filePath of files) {
    const text = fs.readFileSync(filePath, 'utf8');
    const match = pattern.exec(text);
    if (!match) continue;

    const location = lineColumnFromIndex(text, match.index);
    const anchor = {
      file: relative(filePath),
      line: location.line,
      column: location.column,
      kind: sourceKind(filePath),
    };

    if (anchor.kind === 'runtime') return anchor;
    if (!fallback) fallback = anchor;
  }

  return fallback;
}

function firstSourceMapAnchor(toolName, rawMap) {
  const pattern = new RegExp(`\\b${escapeRegex(toolName)}\\b`);
  let dependencyFallback = null;

  for (let index = 0; index < rawMap.sourcesContent.length; index += 1) {
    const content = rawMap.sourcesContent[index] || '';
    const match = pattern.exec(content);
    if (!match) continue;

    const location = lineColumnFromIndex(content, match.index);
    const anchor = {
      source: rawMap.sources[index],
      line: location.line,
      column: location.column,
      kind: sourceMapKind(rawMap.sources[index]),
    };

    if (anchor.kind === 'first-party') return anchor;
    if (!dependencyFallback) dependencyFallback = anchor;
  }

  return dependencyFallback;
}

function appendLedger(record) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.appendFileSync(ledgerPath, JSON.stringify(record) + '\n', 'utf8');
}

function main() {
  const bridge = readJson(bridgePath);
  const allowedTools = Array.isArray(bridge.allowed_tools) ? bridge.allowed_tools : [];
  const rawMap = readJson(mapPath);
  const files = scanTargets
    .flatMap(target => walkFiles(path.join(workspaceRoot, target)))
    .filter((filePath, index, all) => all.indexOf(filePath) === index);

  const toolAnchors = allowedTools.map((tool) => {
    const projectAnchor = firstProjectAnchor(tool, files);
    const sourceMapAnchor = firstSourceMapAnchor(tool, rawMap);
    return {
      tool,
      projectAnchor,
      sourceMapAnchor,
      projectAnchored: Boolean(projectAnchor),
      runtimeAnchored: Boolean(projectAnchor && projectAnchor.kind === 'runtime'),
      sourceMapAnchored: Boolean(sourceMapAnchor),
      sourceMapFirstPartyAnchored: Boolean(sourceMapAnchor && sourceMapAnchor.kind === 'first-party'),
    };
  });

  const missingProjectAnchors = toolAnchors.filter(item => !item.projectAnchored).map(item => item.tool);
  const missingRuntimeAnchors = toolAnchors.filter(item => !item.runtimeAnchored).map(item => item.tool);
  const sourceMapAnchoredTools = toolAnchors.filter(item => item.sourceMapAnchored).map(item => item.tool);
  const firstPartySourceMapTools = toolAnchors.filter(item => item.sourceMapFirstPartyAnchored).map(item => item.tool);

  const cliExists = fs.existsSync(cliPath);
  const mapExists = fs.existsSync(mapPath);
  const mapPass = rawMap.version === 3
    && Array.isArray(rawMap.sources)
    && Array.isArray(rawMap.sourcesContent)
    && rawMap.sources.length === 4756
    && rawMap.sourcesContent.length === 4756;

  const status = allowedTools.length >= 100
    && cliExists
    && mapExists
    && mapPass
    && missingProjectAnchors.length === 0
    ? 'pass'
    : 'fail';

  const result = {
    status,
    generatedAt: now(),
    workspaceRoot,
    bridge: {
      path: relative(bridgePath),
      bridgeVersion: bridge.bridgeVersion || null,
      enforcementMode: bridge.enforcementMode || null,
      remoteMcpEnabled: Boolean(bridge.remote_mcp_enabled),
      declaredAllowedTools: allowedTools.length,
      sha256: sha256File(bridgePath),
    },
    cli: {
      path: relative(cliPath),
      exists: cliExists,
      sha256: cliExists ? sha256File(cliPath) : null,
    },
    cliMap: {
      path: relative(mapPath),
      exists: mapExists,
      sha256: mapExists ? sha256File(mapPath) : null,
      metadata: {
        version: rawMap.version,
        sourceCount: Array.isArray(rawMap.sources) ? rawMap.sources.length : 0,
        sourcesContentCount: Array.isArray(rawMap.sourcesContent) ? rawMap.sourcesContent.length : 0,
      },
    },
    coverage: {
      scannedFiles: files.length,
      bridgeTools: allowedTools.length,
      projectAnchoredTools: toolAnchors.filter(item => item.projectAnchored).length,
      runtimeAnchoredTools: toolAnchors.filter(item => item.runtimeAnchored).length,
      sourceMapAnchoredTools: sourceMapAnchoredTools.length,
      sourceMapFirstPartyAnchoredTools: firstPartySourceMapTools.length,
      missingProjectAnchors,
      missingRuntimeAnchors,
    },
    interpretation: {
      projectAnchors: 'Every bridge tool must appear in governed project source or skill/test/verifier files.',
      runtimeAnchors: 'Runtime anchors are preferred, but some tools may be governed through skill or verifier surfaces.',
      sourceMapAnchors: 'Direct cli.js.map anchors are recorded when the compiled CLI bundle contains the tool name; MCP-only tools remain anchored through bridge/source files.',
    },
    samples: toolAnchors.slice(0, 25),
  };

  if (shouldLog) {
    appendLedger({
      timestamp: result.generatedAt,
      type: 'TOOL_SOURCE_ALIGNMENT',
      action: 'verify_tool_source_alignment',
      status: status === 'pass' ? 'SUCCESS' : 'FAILED',
      bridgeTools: result.coverage.bridgeTools,
      projectAnchoredTools: result.coverage.projectAnchoredTools,
      runtimeAnchoredTools: result.coverage.runtimeAnchoredTools,
      sourceMapAnchoredTools: result.coverage.sourceMapAnchoredTools,
      mapAnchor: result.cliMap.path,
      bridgeHash: result.bridge.sha256,
      cliMapHash: result.cliMap.sha256,
    });
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (status !== 'pass') process.exitCode = 1;
}

try {
  main();
} catch (error) {
  const payload = {
    status: 'error',
    generatedAt: now(),
    message: error.message,
  };
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = 1;
}

