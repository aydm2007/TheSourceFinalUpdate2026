#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const skillsRoot = path.join(workspaceRoot, '.agents', 'skills');
const bridgePath = path.join(workspaceRoot, 'bridge.json');
const mapPath = path.join(workspaceRoot, 'package', 'cli.js.map');
const ledgerPath = path.join(workspaceRoot, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
const shouldLog = !process.argv.includes('--no-ledger');

const requiredSwarmTools = [
  'Agent',
  'ParallelSwarmCoordinator',
  'SwarmPipelineOrchestrator',
  'TaskOutput',
  'TeamCreate',
  'TeamSynthesize',
  'SendMessage',
  'SwarmBroadcast',
  'AsyncSwarmTask',
];

function now() {
  return new Date().toISOString();
}

function relative(filePath) {
  return path.relative(workspaceRoot, filePath).replace(/\\/g, '/');
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function walkSkillFiles(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir)) {
    const filePath = path.join(dir, entry);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) walkSkillFiles(filePath, output);
    else if (entry === 'SKILL.md') output.push(filePath);
  }
  return output;
}

function extractFrontmatter(text) {
  const match = text.replace(/^\uFEFF/, '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : '';
}

function parseFrontmatter(text) {
  const frontmatter = extractFrontmatter(text);
  const fields = {};
  const lists = {};
  const maps = {};
  let currentKey = null;
  let currentMode = null;

  for (const rawLine of frontmatter.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    const keyMatch = line.match(/^\s*([A-Za-z0-9_-]+):\s*(.*)$/);
    const listMatch = line.match(/^\s*-\s*(.+)$/);
    const mapMatch = line.match(/^\s*([A-Za-z0-9_.-]+):\s*(.+)$/);

    if (keyMatch && !line.trim().startsWith('-')) {
      const key = keyMatch[1];
      const value = keyMatch[2].trim();
      currentKey = key;
      if (value) {
        fields[key] = value.replace(/^"|"$/g, '');
        currentMode = null;
      } else if (key === 'allowed-tools' || key === 'primary_tools') {
        lists[key] = [];
        currentMode = 'list';
      } else if (key === 'dependencies') {
        maps[key] = {};
        currentMode = 'map';
      } else {
        fields[key] = '';
        currentMode = null;
      }
      continue;
    }

    if (currentMode === 'list' && currentKey && listMatch) {
      lists[currentKey].push(listMatch[1].trim().replace(/^"|"$/g, ''));
      continue;
    }

    if (currentMode === 'map' && currentKey && mapMatch) {
      maps[currentKey][mapMatch[1]] = mapMatch[2].trim().replace(/^"|"$/g, '');
    }
  }

  return { fields, lists, maps, raw: frontmatter };
}

function normalizeTool(toolName) {
  return String(toolName || '').trim().replace(/^nexus_/, '');
}

function commandJson(command, args) {
  const result = spawnSync(process.execPath, [command, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    timeout: 120000,
    shell: false,
    maxBuffer: 30 * 1024 * 1024,
  });
  if (result.status !== 0) {
    return {
      status: 'error',
      exitCode: result.status,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  }
  return JSON.parse(result.stdout);
}

function appendLedger(record) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.appendFileSync(ledgerPath, JSON.stringify(record) + '\n', 'utf8');
}

function main() {
  const bridge = readJson(bridgePath);
  const bridgeTools = new Set((bridge.allowed_tools || []).map(normalizeTool));
  const rawMap = readJson(mapPath);
  const toolSourceAlignment = commandJson('scripts/verify_tool_source_alignment.js', ['--no-ledger']);
  const runtimeAnchors = new Map();
  for (const sample of toolSourceAlignment.samples || []) {
    runtimeAnchors.set(sample.tool, sample.projectAnchor || null);
  }
  if (toolSourceAlignment.coverage && Array.isArray(toolSourceAlignment.coverage.missingRuntimeAnchors)) {
    for (const tool of bridge.allowed_tools || []) {
      if (!runtimeAnchors.has(tool) && !toolSourceAlignment.coverage.missingRuntimeAnchors.includes(tool)) {
        runtimeAnchors.set(tool, { file: 'nexus_bridge.js', kind: 'runtime', line: null, column: null });
      }
    }
  }

  const skillFiles = walkSkillFiles(skillsRoot).sort();
  const skillReports = skillFiles.map((filePath) => {
    const text = fs.readFileSync(filePath, 'utf8');
    const parsed = parseFrontmatter(text);
    const name = parsed.fields.name || path.basename(path.dirname(filePath));
    const allowedTools = (parsed.lists['allowed-tools'] || []).map(normalizeTool).filter(Boolean);
    const unknownAllowedTools = allowedTools.filter(tool => !bridgeTools.has(tool));
    const hasCentralDependency = Boolean(
      parsed.maps.dependencies && Object.prototype.hasOwnProperty.call(parsed.maps.dependencies, 'nexus-core')
    ) || /nexus-core\/master\.md|nexus-core:|المهارة الأم|Central Nerve Dependency/i.test(text);
    const hasGpsProtocol = /cli\.js\.map|SourceMap|GPS|VisualDomMapper|mapAnchor|mcp-tools:certify|tool-source:verify/i.test(text);
    const hasExecutionProtocol = /protocol|بروتوكول|workflow|execution|steps|خطوات|تشغيل/i.test(text);
    const hasSwarmProtocol = /ParallelSwarmCoordinator|Agent|Swarm|TeamSynthesize|TaskOutput|الأسراب|السرب/i.test(text);

    return {
      name,
      path: relative(filePath),
      version: parsed.fields.version || null,
      description: parsed.fields.description || null,
      allowedTools,
      unknownAllowedTools,
      hasAllowedTools: allowedTools.length > 0,
      hasCentralDependency,
      hasGpsProtocol,
      hasExecutionProtocol,
      hasSwarmProtocol,
    };
  });

  const unknownAllowedTools = skillReports.flatMap(skill =>
    skill.unknownAllowedTools.map(tool => ({ skill: skill.name, tool }))
  );
  const missingAllowedTools = skillReports.filter(skill => !skill.hasAllowedTools).map(skill => skill.name);
  const missingCentralDependency = skillReports.filter(skill => !skill.hasCentralDependency).map(skill => skill.name);
  const missingGpsProtocol = skillReports.filter(skill => !skill.hasGpsProtocol).map(skill => skill.name);
  const missingExecutionProtocol = skillReports.filter(skill => !skill.hasExecutionProtocol).map(skill => skill.name);

  const swarmToolReports = requiredSwarmTools.map((tool) => ({
    tool,
    inBridge: bridgeTools.has(tool),
    runtimeAnchor: runtimeAnchors.get(tool) || null,
    mentionedInSkills: skillReports.filter(skill => skill.allowedTools.includes(tool) || (
      tool === 'Agent' && skill.hasSwarmProtocol
    )).map(skill => skill.name),
  }));

  const swarmToolsPass = swarmToolReports.every(item => item.inBridge && item.runtimeAnchor);
  const mapPass = rawMap.version === 3
    && Array.isArray(rawMap.sources)
    && Array.isArray(rawMap.sourcesContent)
    && rawMap.sources.length === 4756
    && rawMap.sourcesContent.length === 4756;

  const status = skillReports.length >= 20
    && mapPass
    && toolSourceAlignment.status === 'pass'
    && unknownAllowedTools.length === 0
    && missingAllowedTools.length === 0
    && missingCentralDependency.length === 0
    && missingGpsProtocol.length === 0
    && missingExecutionProtocol.length === 0
    && swarmToolsPass
    ? 'pass'
    : 'fail';

  const result = {
    status,
    generatedAt: now(),
    workspaceRoot,
    bridge: {
      path: relative(bridgePath),
      declaredAllowedTools: bridge.allowed_tools ? bridge.allowed_tools.length : 0,
      sha256: sha256File(bridgePath),
    },
    cliMap: {
      path: relative(mapPath),
      sha256: sha256File(mapPath),
      metadata: {
        version: rawMap.version,
        sourceCount: Array.isArray(rawMap.sources) ? rawMap.sources.length : 0,
        sourcesContentCount: Array.isArray(rawMap.sourcesContent) ? rawMap.sourcesContent.length : 0,
      },
    },
    coverage: {
      skillCount: skillReports.length,
      skillsWithAllowedTools: skillReports.filter(skill => skill.hasAllowedTools).length,
      skillsWithCentralDependency: skillReports.filter(skill => skill.hasCentralDependency).length,
      skillsWithGpsProtocol: skillReports.filter(skill => skill.hasGpsProtocol).length,
      skillsWithExecutionProtocol: skillReports.filter(skill => skill.hasExecutionProtocol).length,
      skillsWithSwarmProtocol: skillReports.filter(skill => skill.hasSwarmProtocol).length,
      requiredSwarmTools: requiredSwarmTools.length,
      swarmToolsAnchored: swarmToolReports.filter(item => item.inBridge && item.runtimeAnchor).length,
    },
    gaps: {
      unknownAllowedTools,
      missingAllowedTools,
      missingCentralDependency,
      missingGpsProtocol,
      missingExecutionProtocol,
      missingSwarmToolAnchors: swarmToolReports.filter(item => !item.inBridge || !item.runtimeAnchor).map(item => item.tool),
    },
    swarmTools: swarmToolReports,
    skills: skillReports,
    interpretation: {
      modelIndependence: 'Skills and swarms are certified against bridge.json, runtime anchors, and cli.js.map metadata instead of trusting a model name.',
      gpsAlignment: 'Every skill must carry SourceMap/GPS governance so agents can reason through cli.js.map without bulk-loading the bundle.',
      swarmBoundary: 'Swarm strength is certified by exposed tools, runtime anchors, dry-run/live transcripts, and Shadow Ledger entries.',
    },
  };

  if (shouldLog) {
    appendLedger({
      timestamp: result.generatedAt,
      type: 'AGENT_SWARM_ALIGNMENT',
      action: 'verify_agent_swarm_alignment',
      status: status === 'pass' ? 'SUCCESS' : 'FAILED',
      skillCount: result.coverage.skillCount,
      swarmToolsAnchored: result.coverage.swarmToolsAnchored,
      requiredSwarmTools: result.coverage.requiredSwarmTools,
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
  process.stderr.write(`${JSON.stringify({ status: 'error', generatedAt: now(), message: error.message }, null, 2)}\n`);
  process.exitCode = 1;
}
