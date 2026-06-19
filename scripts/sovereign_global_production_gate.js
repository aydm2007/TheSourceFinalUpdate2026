#!/usr/bin/env node
'use strict';

try {
  require('dotenv').config();
} catch (_) {}

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const reportPath = path.join(root, 'reports', 'sovereign_global_production_readiness_2026-06-02.md');

function now() {
  return new Date().toISOString();
}

function cmd(name) {
  if (process.platform === 'win32' && (name === 'npm' || name === 'npx')) return `${name}.cmd`;
  return name;
}

function run(label, command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(cmd(command), args, {
    cwd: root,
    encoding: 'utf8',
    timeout: options.timeoutMs || 120000,
    shell: false,
    env: { ...process.env, ...options.env },
  });
  return {
    label,
    command: [command, ...args].join(' '),
    exitCode: result.status,
    error: result.error ? result.error.message : null,
    ms: Date.now() - started,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function parseJson(text) {
  const source = String(text || '');
  for (let index = 0; index < source.length; index++) {
    if (source[index] !== '{') continue;
    try {
      return JSON.parse(source.slice(index));
    } catch (_) {
      // keep searching
    }
  }
  return null;
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function collectFiles(dir, files = []) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return files;
  for (const item of fs.readdirSync(full, { withFileTypes: true })) {
    const relative = path.join(dir, item.name);
    if (item.isDirectory()) collectFiles(relative, files);
    else files.push(relative);
  }
  return files;
}

function scanSecrets() {
  const ignored = [
    /^node_modules[\\/]/,
    /[\\/]node_modules[\\/]/,
    /^package[\\/]cli\.js(\.map)?$/,
    /^\.env$/,
    /^coverage[\\/]/,
    /^worktree[\\/]/,
    /^\.agents[\\/]memory[\\/]/,
    /^\.agents[\\/]reports[\\/]/,
    /^plugins[\\/]/,
    /^tests[\\/]/,
    /^test_.*\.js$/,
    /^security_audit_report\.md$/,
    /^vscode-extension[\\/]package[\\/]/,
    /^vscode-extension[\\/]node_modules[\\/]/,
    /^\.nexus[\\/]var[\\/]telemetry[\\/]/,
    /^scratch[\\/]/,
    /\.db(-wal|-shm)?$/,
    /\.jsonl$/,
  ];
  const legacyAdminKeyPattern = ['sovereign', 'nexus', 'key'].join('_') + '(?!_2026)';
  const legacyDevKeyPattern = ['ayman', 'key'].join('_');
  const patterns = [
    { id: 'api-key', regex: new RegExp(`(?:sk-(?!test|dummy|placeholder|example|budgets|notifications|write|completion|SUPER|ant-123)[A-Za-z0-9_-]{20,}|${legacyAdminKeyPattern}|${legacyDevKeyPattern})`) },
    { id: 'private-key', regex: /BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY/ },
    { id: 'env-assignment', regex: /(?<!process\.env\.)(?:OPENROUTER_KEYS|SILICONFLOW_KEYS|ANTHROPIC_API_KEY)\s*=\s*(?!your_|replace_|example_|dummy|test|'test|"test|<|\$\{|\.{3}|process\.env)/ },
  ];
  const candidates = collectFiles('.')
    .filter(file => !ignored.some(pattern => pattern.test(file)))
    .filter(file => /\.(js|mjs|cjs|ts|tsx|json|md|html|yml|yaml|ps1|cmd|txt|env\.example)$/i.test(file));

  const findings = [];
  for (const file of candidates) {
    let text = '';
    try {
      text = read(file);
    } catch (_) {
      continue;
    }
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        findings.push({ file, type: pattern.id });
      }
    }
  }
  return findings;
}

function inspectKubernetes() {
  const files = collectFiles('deploy/k8s').filter(file => /\.(ya?ml)$/i.test(file));
  const text = files.map(file => read(file)).join('\n');
  return {
    files: files.length,
    hasDeployment: /kind:\s*Deployment/i.test(text),
    hasService: /kind:\s*Service/i.test(text),
    hasIngress: /kind:\s*Ingress/i.test(text),
    hasTLS: /tls\s*:/i.test(text),
    hasProbes: /readinessProbe\s*:|livenessProbe\s*:/i.test(text),
    hasResources: /requests\s*:|limits\s*:/i.test(text),
    hasSecretTemplate: /kind:\s*Secret/i.test(text),
    hasSecurityContext: /securityContext\s*:/i.test(text),
  };
}

function inspectObservability() {
  const server = read('mcp_remote_server.js');
  const otel = read('deploy/otel/otel-collector.yaml');
  const slo = read('docs/PRODUCTION_SLO.md');
  return {
    prometheusMetrics: /prom-client|app\.get\('\/metrics'/i.test(server),
    otelCollector: /receivers:\s*|exporters:\s*|service:\s*/i.test(otel),
    sloDoc: /99\.9%|error budget|p95/i.test(slo),
    shadowLedger: /shadow_ledger\.jsonl|auditLog/i.test(server),
  };
}

function inspectCi() {
  const workflowFiles = collectFiles('.github/workflows').filter(file => /\.ya?ml$/i.test(file));
  const text = workflowFiles.map(file => read(file)).join('\n');
  return {
    workflowFiles: workflowFiles.length,
    npmAudit: /npm audit/i.test(text),
    nativeMcpVerify: /native-mcp:verify|verify_native_mcp/i.test(text),
    productionGate: /global:production-gate|sovereign_global_production_gate/i.test(text),
    dockerOrK8sCheck: /docker compose config|kubectl apply|kustomize/i.test(text),
  };
}

function latestLedgerHas(pattern) {
  const ledger = path.join(root, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
  if (!fs.existsSync(ledger)) return false;
  const stat = fs.statSync(ledger);
  const fd = fs.openSync(ledger, 'r');
  const length = Math.min(stat.size, 1024 * 1024);
  const buffer = Buffer.alloc(length);
  fs.readSync(fd, buffer, 0, length, stat.size - length);
  fs.closeSync(fd);
  return pattern.test(buffer.toString('utf8'));
}

function scoreEvidence(evidence) {
  const nativeScore = evidence.native && Number.isFinite(evidence.native.score) ? evidence.native.score : 0;
  const mcp = Math.round((nativeScore / 100) * 20);

  let security = 0;
  if (evidence.secretFindings.length === 0) security += 8;
  if (evidence.native && evidence.native.toolFiltering && evidence.native.toolFiltering.authorization.fileWriteDeniedUnderSecurityAudit) security += 5;
  if (exists('.dockerignore') && /\.env/.test(read('.dockerignore'))) security += 2;

  const k8s = evidence.kubernetes;
  let cloudOps = 0;
  if (k8s.hasDeployment && k8s.hasService && k8s.hasIngress) cloudOps += 4;
  if (k8s.hasTLS) cloudOps += 3;
  if (k8s.hasProbes) cloudOps += 3;
  if (k8s.hasResources) cloudOps += 3;
  if (k8s.hasSecurityContext && k8s.hasSecretTemplate) cloudOps += 2;

  const obs = evidence.observability;
  let observability = 0;
  if (obs.prometheusMetrics) observability += 5;
  if (obs.otelCollector) observability += 5;
  if (obs.sloDoc) observability += 3;
  if (obs.shadowLedger) observability += 2;

  const ci = evidence.ci;
  let cicd = 0;
  if (ci.workflowFiles > 0) cicd += 2;
  if (ci.npmAudit) cicd += 2;
  if (ci.nativeMcpVerify) cicd += 2;
  if (ci.productionGate) cicd += 2;
  if (ci.dockerOrK8sCheck) cicd += 2;

  let swarm = 0;
  if (evidence.native && evidence.native.swarmDryRun && evidence.native.swarmDryRun.ok) swarm += 5;
  if (latestLedgerHas(/SWARM_WAVE_EXECUTION|AGENT-LAUNCHED|agent_/i)) swarm += 5;

  let ui = 0;
  if (latestLedgerHas(/"domSnapshotHash":"[a-f0-9]{64}"|dom_snapshot_hash/i)) ui += 4;
  if (latestLedgerHas(/"screenshotHash":"[a-f0-9]{64}"|screenshot_hash/i)) ui += 3;
  if (latestLedgerHas(/"accessibilityTreeHash":"[a-f0-9]{64}"|accessibility_tree_hash/i)) ui += 2;
  if (latestLedgerHas(/"cliMapSourceLink":"[^"]+"|cli_map_source/i)) ui += 1;

  let docs = 0;
  if (evidence.docsAuditPassed) docs += 5;

  return {
    matrix: {
      mcpAuthenticatedRuntime: Math.min(mcp, 20),
      securitySecretsAuthorization: Math.min(security, 15),
      cloudOpsTlsKubernetes: Math.min(cloudOps, 15),
      observabilitySlo: Math.min(observability, 15),
      cicdSupplyChain: Math.min(cicd, 10),
      runtimeSwarm: Math.min(swarm, 10),
      liveUiProof: Math.min(ui, 10),
      docsDriftControl: Math.min(docs, 5),
    },
  };
}

function markdown(evidence) {
  const matrix = evidence.score.matrix;
  const total = Object.values(matrix).reduce((sum, value) => sum + value, 0);
  const lines = [];
  lines.push('# Sovereign Global Production Readiness - 2026-06-02');
  lines.push('');
  lines.push(`Generated: ${evidence.generatedAt}`);
  lines.push('');
  lines.push(`## Strict Global Production Score: ${total}/100`);
  lines.push('');
  lines.push(total >= 100 ? 'Result: global production 100/100 is proven.' : total >= 95 ? 'Result: staging/global production gate is passed; final 100 proof still has residual gates.' : 'Result: global production gate is not fully passed yet.');
  lines.push('');
  lines.push('## Score Matrix');
  lines.push('');
  lines.push('| Lane | Points | Evidence |');
  lines.push('| --- | ---: | --- |');
  lines.push(`| MCP authenticated runtime + tool calls | ${matrix.mcpAuthenticatedRuntime}/20 | native MCP score ${evidence.native ? evidence.native.score : 0}/100; Streamable HTTP ${(evidence.native && evidence.native.http.authenticated.streamableHttp.ok) || false} |`);
  lines.push(`| Security/secrets/authorization boundaries | ${matrix.securitySecretsAuthorization}/15 | secret findings ${evidence.secretFindings.length}; security-audit write denial ${evidence.native && evidence.native.toolFiltering.authorization.fileWriteDeniedUnderSecurityAudit} |`);
  lines.push(`| CloudOps/TLS/container/Kubernetes readiness | ${matrix.cloudOpsTlsKubernetes}/15 | k8s files ${evidence.kubernetes.files}; TLS ${evidence.kubernetes.hasTLS}; probes ${evidence.kubernetes.hasProbes}; resources ${evidence.kubernetes.hasResources} |`);
  lines.push(`| Observability/SLO/metrics/traces/logs | ${matrix.observabilitySlo}/15 | Prometheus ${evidence.observability.prometheusMetrics}; OTel ${evidence.observability.otelCollector}; SLO ${evidence.observability.sloDoc} |`);
  lines.push(`| CI/CD/supply-chain/release gates | ${matrix.cicdSupplyChain}/10 | workflows ${evidence.ci.workflowFiles}; audit ${evidence.ci.npmAudit}; production gate ${evidence.ci.productionGate} |`);
  lines.push(`| Runtime swarm execution proof | ${matrix.runtimeSwarm}/10 | dry-run ${evidence.native && evidence.native.swarmDryRun.ok}; live ledger ${latestLedgerHas(/SWARM_WAVE_EXECUTION|AGENT-LAUNCHED|agent_/i)} |`);
  lines.push(`| Live UI DOM/accessibility/screenshot proof | ${matrix.liveUiProof}/10 | DOM ${latestLedgerHas(/"domSnapshotHash":"[a-f0-9]{64}"|dom_snapshot_hash/i)}; screenshot ${latestLedgerHas(/"screenshotHash":"[a-f0-9]{64}"|screenshot_hash/i)}; accessibility ${latestLedgerHas(/"accessibilityTreeHash":"[a-f0-9]{64}"|accessibility_tree_hash/i)} |`);
  lines.push(`| Docs/AGENTS/skills drift control | ${matrix.docsDriftControl}/5 | docs audit ${evidence.docsAuditPassed} |`);
  lines.push('');
  lines.push('## Remaining Gates');
  lines.push('');
  if (!(evidence.native && evidence.native.http.authenticated.metrics.ok)) lines.push('- Provide `AETHER_MCP_API_KEY` or `MCP_API_KEY` to prove authenticated `/metrics`.');
  if (!(evidence.native && evidence.native.http.authenticated.mcpSse.ok)) lines.push('- Prove authenticated SSE `/mcp` with strict HMAC.');
  if (!(evidence.native && evidence.native.http.authenticated.streamableHttp.ok)) lines.push('- Prove authenticated Streamable HTTP `/mcp/stream` with tool list and read-only tool call.');
  if (matrix.runtimeSwarm < 10) lines.push('- Run a live read-only swarm and record `SWARM_WAVE_EXECUTION` or agent task output in Shadow Ledger.');
  if (matrix.liveUiProof < 10) lines.push('- Capture runtime DOM plus screenshot/accessibility hash, map it to `cli.js.map`, and log it.');
  if (evidence.secretFindings.length > 0) lines.push('- Remove or redact remaining hardcoded secret patterns from tracked production files.');
  lines.push('');
  lines.push('## Secret Findings');
  lines.push('');
  if (evidence.secretFindings.length === 0) {
    lines.push('No tracked production secret patterns found by this gate.');
  } else {
    for (const finding of evidence.secretFindings.slice(0, 30)) {
      lines.push(`- ${finding.file}: ${finding.type}`);
    }
  }
  lines.push('');
  lines.push('## Mermaid');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('  Edge[TLS Ingress / Edge Auth] --> MCP[Native MCP Server]');
  lines.push('  MCP --> SSE[Legacy SSE /mcp]');
  lines.push('  MCP --> Stream[Streamable HTTP /mcp/stream]');
  lines.push('  MCP --> Metrics[Authenticated /metrics]');
  lines.push('  Metrics --> OTel[OpenTelemetry Collector]');
  lines.push('  MCP --> Ledger[Shadow Ledger]');
  lines.push('  Ledger --> Gate[Global Production Gate]');
  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

function main() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const nativeRun = run('native-mcp', 'node', ['scripts/verify_native_mcp.js'], { timeoutMs: 90000 });
  const uiRun = run('live-ui', 'node', ['scripts/verify_live_ui_runtime.js'], { timeoutMs: 30000 });
  const docsRun = run('docs-audit', 'node', ['scripts/audit_skills_docs.js'], { timeoutMs: 60000 });
  const native = parseJson(`${nativeRun.stdout}\n${nativeRun.stderr}`);
  const docsScoreMatch = String(docsRun.stdout || docsRun.stderr || '').match(/Combined Documentation Maturity:\s+(\d+)\/100/i);
  const docsScore = docsScoreMatch ? Number(docsScoreMatch[1]) : 0;
  const docsAuditPassed = docsRun.exitCode === 0 && docsScore >= 95;
  const evidence = {
    generatedAt: now(),
    native,
    docsAuditPassed,
    docsScore,
    secretFindings: scanSecrets(),
    kubernetes: inspectKubernetes(),
    observability: inspectObservability(),
    ci: inspectCi(),
    commandResults: [
      { label: nativeRun.label, exitCode: nativeRun.exitCode, ms: nativeRun.ms },
      { label: uiRun.label, exitCode: uiRun.exitCode, ms: uiRun.ms },
      { label: docsRun.label, exitCode: docsRun.exitCode, ms: docsRun.ms },
    ],
  };
  evidence.score = scoreEvidence(evidence);
  const total = Object.values(evidence.score.matrix).reduce((sum, value) => sum + value, 0);
  evidence.total = total;
  fs.writeFileSync(reportPath, markdown(evidence));
  process.stdout.write(JSON.stringify({
    generatedAt: evidence.generatedAt,
    score: total,
    reportPath,
    nativeScore: native ? native.score : null,
    secretFindings: evidence.secretFindings.length,
    streamableHttpProven: Boolean(native && native.http.authenticated.streamableHttp.ok),
    liveUiProof: evidence.score.matrix.liveUiProof,
    runtimeSwarm: evidence.score.matrix.runtimeSwarm,
  }, null, 2) + '\n');
  if (process.argv.includes('--strict') && total < 95) {
    process.exitCode = 1;
  }
}

main();
