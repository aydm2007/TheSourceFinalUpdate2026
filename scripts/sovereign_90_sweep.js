#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Load environment variables from .env file
require('dotenv').config();

const root = path.resolve(__dirname, '..');
const reportPath = path.join(root, 'reports', 'sovereign_90_readiness_report_2026-06-02.md');
const full = process.argv.includes('--full') || process.env.AETHER_RUN_FULL_SWEEP === '1';
const runVitest = full || process.env.AETHER_RUN_VITEST === '1';

function now() {
  return new Date().toISOString();
}

function commandName(name) {
  if (process.platform === 'win32' && (name === 'npm' || name === 'npx')) return `${name}.cmd`;
  return name;
}

function run(label, command, args, options = {}) {
  const started = Date.now();
  const useCmdShim = process.platform === 'win32' && (command === 'npm' || command === 'npx');
  const result = spawnSync(
    useCmdShim ? (process.env.ComSpec || 'cmd.exe') : commandName(command),
    useCmdShim ? ['/d', '/s', '/c', [command, ...args].join(' ')] : args,
    {
    cwd: root,
    encoding: 'utf8',
    timeout: options.timeoutMs || 120000,
    env: { ...process.env, ...options.env },
    shell: false,
    }
  );
  const ms = Date.now() - started;
  return {
    label,
    command: [command, ...args].join(' '),
    exitCode: result.status,
    signal: result.signal || null,
    timedOut: Boolean(result.error && /timed out/i.test(result.error.message)),
    error: result.error ? result.error.message : null,
    ms,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function parseJsonFromOutput(text) {
  const source = String(text || '');
  const indexes = [];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '{') indexes.push(i);
  }
  for (const index of indexes) {
    try {
      return JSON.parse(source.slice(index));
    } catch (_) {
      // try next candidate
    }
  }
  return null;
}

function summarizeOutput(result, max = 1200) {
  const combined = `${result.stdout || ''}\n${result.stderr || ''}\n${result.error ? `ERROR: ${result.error}` : ''}`.trim();
  return combined.length > max ? `${combined.slice(0, max)}\n... [truncated]` : combined;
}

function inspectCloudOps() {
  const dockerfile = path.join(root, 'Dockerfile');
  const compose = path.join(root, 'docker-compose.yml');
  const dockerignore = path.join(root, '.dockerignore');
  const ciDir = path.join(root, '.github', 'workflows');
  const dockerText = fs.existsSync(dockerfile) ? fs.readFileSync(dockerfile, 'utf8') : '';
  const composeText = fs.existsSync(compose) ? fs.readFileSync(compose, 'utf8') : '';
  return {
    dockerfile: fs.existsSync(dockerfile),
    dockerignore: fs.existsSync(dockerignore),
    compose: fs.existsSync(compose),
    ciWorkflows: fs.existsSync(ciDir),
    dockerHasHealthcheck: /HEALTHCHECK/i.test(dockerText),
    dockerHasNonRootUser: /^\s*USER\s+(?!root\b).+/im.test(dockerText),
    composeHasHealthcheck: /healthcheck\s*:/i.test(composeText),
    composeHasResourceLimits: /(mem_limit|cpus|deploy\s*:|resources\s*:|limits\s*:)/i.test(composeText),
    composeHasSecretsMount: /(secrets\s*:|env_file\s*:)/i.test(composeText),
  };
}

function pointsForTests(results) {
  let score = 0;
  const health = results.find(r => r.label === 'health-check');
  const fixes = results.find(r => r.label === 'validate-fixes');
  const runner = results.find(r => r.label === 'test-runner');
  const vitest = results.find(r => r.label === 'vitest');
  const audit = results.find(r => r.label === 'npm-audit');
  const auditJson = audit ? parseJsonFromOutput(audit.stdout || '') : null;
  if (health && health.exitCode === 0) score += 2;
  if (fixes && fixes.exitCode === 0) score += 2;
  if (runner && runner.exitCode === 0) score += 2;
  if (vitest && vitest.exitCode === 0) score += 2;
  if (auditJson && auditJson.metadata && auditJson.metadata.vulnerabilities && auditJson.metadata.vulnerabilities.total === 0) score += 2;
  return Math.min(score, 10);
}

function pointsForSecurityDocsTests(evidence) {
  return Math.min(15, (evidence.docsAuditPassed ? 5 : 0) + pointsForTests(evidence.results));
}

function pointsForCloudOps(cloud) {
  let score = 0;
  if (cloud.dockerfile) score += 2;
  if (cloud.dockerignore) score += 2;
  if (cloud.dockerHasHealthcheck || cloud.composeHasHealthcheck) score += 2;
  if (cloud.dockerHasNonRootUser) score += 2;
  if (cloud.composeHasResourceLimits) score += 1;
  if (cloud.composeHasSecretsMount) score += 1;
  return Math.min(score, 10);
}

function calculateScore(evidence) {
  let score = 0;

  const nativeScore = evidence.native && Number.isFinite(evidence.native.score) ? evidence.native.score : 0;
  score += Math.round((nativeScore / 100) * 20);

  const toolFiltering = evidence.native && evidence.native.toolFiltering;
  if (
    toolFiltering
    && toolFiltering.bootstrap.ok
    && toolFiltering.authorization.fileReadUnderMcpDeveloper
    && toolFiltering.authorization.fileWriteDeniedUnderSecurityAudit
  ) score += 15;

  if (evidence.native && evidence.native.level5 && evidence.native.level5.ok) score += 15;
  if (evidence.native && evidence.native.swarmDryRun && evidence.native.swarmDryRun.ok) score += 10;

  if (evidence.cliMap && String(evidence.cliMap.status).toLowerCase() === 'pass') score += 15;

  score += pointsForSecurityDocsTests(evidence);
  score += pointsForCloudOps(evidence.cloudOps);

  return Math.min(score, 100);
}

function statusFor(result) {
  if (!result) return 'not_run';
  if (result.exitCode === 0) return 'pass';
  if (result.timedOut) return 'timeout';
  return 'fail';
}

function markdown(evidence) {
  const lines = [];
  const score = evidence.score;
  const native = evidence.native || {};
  const cli = evidence.cliMap || {};
  const cloud = evidence.cloudOps;

  lines.push('# Sovereign 90+ Readiness Report - 2026-06-02');
  lines.push('');
  lines.push(`Generated: ${evidence.generatedAt}`);
  lines.push('');
  lines.push(`## Strict Score: ${score}/100`);
  lines.push('');
  lines.push(score >= 90
    ? 'Result: 90%+ gate is currently proven by local evidence.'
    : 'Result: 90%+ gate is not fully proven yet; the implementation path is now repeatable and evidence-backed.');
  lines.push('');
  lines.push('## Score Matrix');
  lines.push('');
  lines.push('| Lane | Evidence | Points |');
  lines.push('| --- | --- | ---: |');
  lines.push(`| Native MCP live proof | verify_native_mcp score ${native.score || 0}/100; auth source ${native.http ? native.http.apiKeySource : 'unknown'} | ${Math.round(((native.score || 0) / 100) * 20)}/20 |`);
  const authFilteringOk = native.toolFiltering
    && native.toolFiltering.bootstrap.ok
    && native.toolFiltering.authorization.fileReadUnderMcpDeveloper
    && native.toolFiltering.authorization.fileWriteDeniedUnderSecurityAudit;
  lines.push(`| Authorization + skill filtering | ${authFilteringOk ? 'bootstrap exposure plus pass/deny authorization passed' : 'not proven'} | ${authFilteringOk ? 15 : 0}/15 |`);
  lines.push(`| Level 5 Autonomy routing | ${native.level5 && native.level5.ok ? 'local-sensitive/cloud-abstract routing plus redaction passed' : 'not proven'} | ${native.level5 && native.level5.ok ? 15 : 0}/15 |`);
  lines.push(`| Swarm self-assignment | ${native.swarmDryRun && native.swarmDryRun.ok ? 'ParallelSwarmCoordinator dry-run passed with 3 read-only agents' : 'not proven'} | ${native.swarmDryRun && native.swarmDryRun.ok ? 10 : 0}/10 |`);
  const cliEvidence = cli.status === 'PASS'
    ? `${cli.sourceCount} sources and ${cli.sourcesContentCount} sourcesContent verified`
    : 'not proven';
  const cliStatusPass = String(cli.status || '').toLowerCase() === 'pass';
  lines.push(`| SourceMap/GPS readiness | ${cliStatusPass ? `${cli.metadata ? cli.metadata.sourceCount : cli.sourceCount} sources verified` : cliEvidence} | ${cliStatusPass ? 15 : 0}/15 |`);
  lines.push(`| Tests, security, and docs | docs audit, health, fixes, test runner, Vitest, npm audit | ${pointsForSecurityDocsTests(evidence)}/15 |`);
  lines.push(`| CloudOps baseline | Docker/Compose/health/resource checks | ${pointsForCloudOps(cloud)}/10 |`);
  lines.push('');

  lines.push('## Native MCP Evidence');
  lines.push('');
  lines.push('- Launcher: `launch_native_mcp.cmd`');
  lines.push(`- Base URL: \`${native.http ? native.http.baseUrl : 'not checked'}\``);
  lines.push(`- Unauthenticated \`/metrics\` denied: ${native.http ? native.http.unauthMetricsDenied : false}`);
  lines.push(`- Unauthenticated \`/mcp\` denied: ${native.http ? native.http.unauthMcpDenied : false}`);
  lines.push(`- Authenticated metrics proof: ${native.http && native.http.authenticated ? native.http.authenticated.metrics.ok : false}`);
  lines.push(`- Authenticated SSE proof: ${native.http && native.http.authenticated ? native.http.authenticated.mcpSse.ok : false}`);
  lines.push(`- Admin tool list proof: ${native.http && native.http.authenticated ? native.http.authenticated.allTools.ok : false}`);
  lines.push('');

  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  Launcher[launch_native_mcp.cmd] --> Server[mcp_remote_server.js :3847]');
  lines.push('  Server --> Metrics[/metrics admin]');
  lines.push('  Server --> SSE[/mcp SSE]');
  lines.push('  SSE --> Filter[shared_mcp_core skill filtering]');
  lines.push('  Filter --> Tools[MCP facade tools]');
  lines.push('```');
  lines.push('');

  lines.push('## Level 5 Autonomy');
  lines.push('');
  lines.push('- No-skill bootstrap exposes only `CognitiveRouter`, `LoadSkill`, `AskUserQuestion`, and `SwarmHandoff`.');
  lines.push('- Sensitive AST/security/database tasks route to `LOCAL_KAIROS_MCP`.');
  lines.push('- Abstract/theoretical tasks route to `ANONYMOUS_CLOUD_OPUS` after payload redaction.');
  lines.push('- Cloud Opus 4.8 Mentor remains planner/mentor only; deterministic MCP tools remain the executor/validator path.');
  lines.push('');

  lines.push('```mermaid');
  lines.push('flowchart LR');
  lines.push('  Intent[Task intent] --> Router[CognitiveRouter]');
  lines.push('  Router -->|security/edit/db| Local[Local MCP Executor]');
  lines.push('  Router -->|abstract planning| Redact[Privacy Shield Redaction]');
  lines.push('  Redact --> Mentor[Cloud Opus 4.8 Mentor]');
  lines.push('  Local --> Ledger[Shadow Ledger]');
  lines.push('  Mentor --> Ledger');
  lines.push('```');
  lines.push('');

  lines.push('## Swarm Proof');
  lines.push('');
  lines.push(`- SwarmManager actions: ${(native.toolFiltering && native.toolFiltering.skills ? native.toolFiltering.skills.swarmManagerActions.join(', ') : 'not proven')}`);
  lines.push('- Dry-run wave: 3 read-only agents, wave size 6, no live edits.');
  lines.push('');

  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  Sweep[Massive Parallel Sweep] --> DryRun[ParallelSwarmCoordinator dry_run]');
  lines.push('  DryRun --> Sec[Security read-only]');
  lines.push('  DryRun --> Bridge[Bridge read-only]');
  lines.push('  DryRun --> Ops[CloudOps read-only]');
  lines.push('  Sec --> Scratch[scratch/task_*.json when live agents enabled]');
  lines.push('  Bridge --> Scratch');
  lines.push('  Ops --> Scratch');
  lines.push('```');
  lines.push('');

  lines.push('## Command Results');
  lines.push('');
  lines.push('| Command | Status | Exit | Duration ms |');
  lines.push('| --- | --- | ---: | ---: |');
  for (const result of evidence.results) {
    lines.push(`| \`${result.command}\` | ${statusFor(result)} | ${result.exitCode === null ? 'null' : result.exitCode} | ${result.ms} |`);
  }
  lines.push('');

  lines.push('## CloudOps 4.6 Baseline Via CloudOps-Critic 4.7 Rules');
  lines.push('');
  lines.push(`- Dockerfile present: ${cloud.dockerfile}`);
  lines.push(`- .dockerignore present: ${cloud.dockerignore}`);
  lines.push(`- Compose present: ${cloud.compose}`);
  lines.push(`- Healthcheck present: ${cloud.dockerHasHealthcheck || cloud.composeHasHealthcheck}`);
  lines.push(`- Non-root Docker user: ${cloud.dockerHasNonRootUser}`);
  lines.push(`- Resource limits present: ${cloud.composeHasResourceLimits}`);
  lines.push(`- Secrets/env-file discipline visible: ${cloud.composeHasSecretsMount}`);
  lines.push('');

  lines.push('## Token And Model Best Practices');
  lines.push('');
  lines.push('- Treat `package/cli.js.map` as metadata/GPS evidence only; do not load the 59.8MB map into model context.');
  lines.push('- Use Cloud Opus 4.8 Mentor for decomposition, risk review, and architectural judgment.');
  lines.push('- Use deterministic validators and local MCP executors for evidence, edits, and scoring.');
  lines.push('- Use swarm waves of 5-8 agents, max 3 waves for the first sweep, then scale only after ledger proof.');
  lines.push('');

  lines.push('## 90+ Acceptance Gaps');
  lines.push('');
  if (!(native.http && native.http.authenticated && native.http.authenticated.metrics.ok)) {
    lines.push('- Provide an admin API key through `AETHER_MCP_API_KEY` or `MCP_API_KEY` and rerun `npm run native-mcp:verify` to prove `/metrics`.');
  }
  if (!(native.http && native.http.authenticated && native.http.authenticated.mcpSse.ok)) {
    lines.push('- Prove authenticated `/mcp` SSE with strict `x-mcp-hmac`.');
  }
  if (!(native.http && native.http.authenticated && native.http.authenticated.allTools.ok)) {
    lines.push('- Prove remote admin tool list count from `/admin/api/all-tools`.');
  }
  if (!runVitest) {
    lines.push('- Run `AETHER_RUN_VITEST=1 npm run sovereign:90-sweep` after freeing ports 9998/9999 to include Vitest in the score.');
  }
  if (!cloud.composeHasResourceLimits) {
    lines.push('- Add or prove Compose/Kubernetes resource limits for CloudOps completeness.');
  }
  lines.push('- 100/100 remains blocked until live UI DOM/accessibility/screenshot mapping is proven and logged to Shadow Ledger.');
  lines.push('');

  lines.push('## Raw Evidence Preview');
  lines.push('');
  for (const result of evidence.results) {
    lines.push(`### ${result.label}`);
    lines.push('');
    lines.push('```text');
    lines.push(summarizeOutput(result, 1000));
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const results = [];
  results.push(run('native-mcp', 'node', ['scripts/verify_native_mcp.js'], { timeoutMs: 60000 }));
  results.push(run('cli-map', 'node', ['scripts/verify_cli_map.js', '--no-ledger'], { timeoutMs: 90000 }));
  results.push(run('docs-audit', 'node', ['scripts/audit_skills_docs.js'], { timeoutMs: 60000 }));
  results.push(run('health-check', 'node', ['health-check.js'], { timeoutMs: 60000 }));
  results.push(run('validate-fixes', 'node', ['validate_fixes.js'], { timeoutMs: 60000 }));
  results.push(run('test-runner', 'node', ['tests/test_runner.js'], { timeoutMs: 120000 }));
  results.push(run('npm-audit', 'npm', ['audit', '--json'], { timeoutMs: 120000 }));
  if (runVitest) {
    results.push(run('vitest', 'npx', ['vitest', 'run'], { timeoutMs: 180000 }));
  } else {
    results.push({
      label: 'vitest',
      command: 'npx vitest run',
      exitCode: null,
      signal: null,
      timedOut: false,
      error: 'Skipped by default. Set AETHER_RUN_VITEST=1 or pass --full.',
      ms: 0,
      stdout: '',
      stderr: '',
    });
  }

  const native = parseJsonFromOutput((results[0].stdout || '') + (results[0].stderr || ''));
  const cliMap = parseJsonFromOutput((results[1].stdout || '') + (results[1].stderr || ''));
  const npmAudit = parseJsonFromOutput(results.find(r => r.label === 'npm-audit').stdout || '');
  const docsAudit = results.find(r => r.label === 'docs-audit');
  const docsScoreMatch = String((docsAudit.stdout || '') + (docsAudit.stderr || '')).match(/Combined Documentation Maturity:\s+(\d+)\/100/i);
  const docsScore = docsScoreMatch ? Number(docsScoreMatch[1]) : 0;
  const docsAuditPassed = docsAudit.exitCode === 0 && docsScore >= 95;

  const evidence = {
    generatedAt: now(),
    reportPath,
    results: results.map(result => ({
      label: result.label,
      command: result.command,
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut: result.timedOut,
      error: result.error,
      ms: result.ms,
      stdout: result.stdout,
      stderr: result.stderr,
    })),
    native,
    cliMap,
    npmAuditSummary: npmAudit && npmAudit.metadata ? npmAudit.metadata.vulnerabilities : null,
    docsAuditPassed,
    cloudOps: inspectCloudOps(),
  };
  evidence.score = calculateScore(evidence);

  fs.writeFileSync(reportPath, markdown(evidence));

  const output = {
    generatedAt: evidence.generatedAt,
    score: evidence.score,
    reportPath,
    nativeScore: native ? native.score : null,
    cliMapStatus: cliMap ? cliMap.status : null,
    docsAuditPassed,
    vitestIncluded: runVitest,
    commandStatuses: evidence.results.map(result => ({
      label: result.label,
      status: statusFor(result),
      exitCode: result.exitCode,
    })),
    npmAuditSummary: evidence.npmAuditSummary,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  if (process.argv.includes('--strict') && evidence.score < 90) {
    process.exitCode = 1;
  }
}

main();
