#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const cliPath = path.join(workspaceRoot, 'package', 'cli.js');
const mapPath = path.join(workspaceRoot, 'package', 'cli.js.map');
const ledgerPath = path.join(workspaceRoot, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');

function statSummary(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false };
  }
  const stat = fs.statSync(filePath);
  return {
    exists: true,
    bytes: stat.size,
    lastModified: stat.mtime.toISOString(),
  };
}

function appendLedger(record) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.appendFileSync(ledgerPath, JSON.stringify(record) + '\n', 'utf8');
}

async function main() {
  const shouldLog = !process.argv.includes('--no-ledger');
  const cli = statSummary(cliPath);
  const mapFile = statSummary(mapPath);

  if (!cli.exists || !mapFile.exists) {
    throw new Error('package/cli.js and package/cli.js.map are both required.');
  }

  const rawMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const metadata = {
    version: rawMap.version,
    file: rawMap.file || null,
    sourceCount: Array.isArray(rawMap.sources) ? rawMap.sources.length : 0,
    sourcesContentCount: Array.isArray(rawMap.sourcesContent) ? rawMap.sourcesContent.length : 0,
    firstSources: Array.isArray(rawMap.sources) ? rawMap.sources.slice(0, 5) : [],
    lastSources: Array.isArray(rawMap.sources) ? rawMap.sources.slice(-5) : [],
  };

  const sourceMapPass =
    metadata.version === 3 &&
    metadata.sourceCount === 4756 &&
    metadata.sourcesContentCount === 4756;

  let visualDom = null;
  try {
    const engine = require('../core/security/sovereign_engine.js');
    if (typeof engine.realVisualDomMap === 'function') {
      const result = await engine.realVisualDomMap(mapPath);
      visualDom = {
        status: result.status || null,
        components: result.components || 0,
        hooks: result.hooks || 0,
        pages: result.pages || 0,
        stores: result.stores || 0,
        contentAnalyzed: result.content_analyzed || result.contentAnalyzed || 0,
        mode: 'static_sourcemap_topology',
      };
    }
  } catch (error) {
    visualDom = {
      status: 'error',
      message: error.message,
      mode: 'static_sourcemap_topology',
    };
  }

  const result = {
    status: sourceMapPass ? 'pass' : 'fail',
    timestamp: new Date().toISOString(),
    workspaceRoot,
    cli,
    cliMap: mapFile,
    metadata,
    visualDom,
    liveUiMonitoring: {
      status: 'not_proven',
      reason: 'This verifier reads SourceMap topology only; it does not capture runtime DOM, accessibility tree, or screenshots.',
    },
  };

  if (shouldLog) {
    appendLedger({
      timestamp: result.timestamp,
      type: 'TOOL_EXECUTION',
      action: 'verify_cli_map',
      status: result.status.toUpperCase(),
      source: 'scripts/verify_cli_map.js',
      mapAnchor: 'package/cli.js.map',
      sourceCount: metadata.sourceCount,
      sourcesContentCount: metadata.sourcesContentCount,
      visualDomMode: result.visualDom && result.visualDom.mode,
      liveUiMonitoring: result.liveUiMonitoring.status,
    });
  }

  console.error(JSON.stringify(result, null, 2));

  if (!sourceMapPass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ status: 'error', message: error.message }, null, 2));
  process.exitCode = 1;
});
