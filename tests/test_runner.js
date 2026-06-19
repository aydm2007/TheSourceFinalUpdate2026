// test_runner.js — Nexus Engine V9.0-Omega Unified Test Runner
// Runs all test suites sequentially and produces a consolidated report
// Run: node test_runner.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUITES = [
  { name: 'Unit Tests (Relay Bridge)', file: 'test_relay_bridge.js' },
  { name: 'Behavior Tests (Aether Mock)', file: 'test_behavior.js' },
  { name: 'Relay Bridge Health Tests', file: 'bridgeHealth.test.js' },
];

const results = [];
let totalPassed = 0;
let totalFailed = 0;
const startTime = Date.now();

console.log('\n' + '═'.repeat(60));
console.log('  🚀 Aether Engine Prime — Sovereign Test Runner');
console.log('  📅 ' + new Date().toISOString());
console.log('═'.repeat(60));

for (const suite of SUITES) {
  const filePath = path.join(__dirname, suite.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`\n⚠️  ${suite.name}: FILE NOT FOUND (${suite.file})`);
    results.push({ name: suite.name, status: 'SKIPPED', reason: 'File not found' });
    continue;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`▶ Running: ${suite.name}`);
  console.log(`  File: ${suite.file}`);
  console.log('─'.repeat(60));
  
  try {
    const output = execSync(`node "${filePath}"`, {
      encoding: 'utf8',
      timeout: 60000,
      cwd: __dirname
    });
    console.log(output);
    
    // Parse results from output
    const match = output.match(/(\d+) passed, (\d+) failed/);
    if (match) {
      const passed = parseInt(match[1]);
      const failed = parseInt(match[2]);
      totalPassed += passed;
      totalFailed += failed;
      results.push({ name: suite.name, status: failed === 0 ? 'PASS' : 'FAIL', passed, failed });
    } else {
      results.push({ name: suite.name, status: 'PASS', passed: '?', failed: 0 });
    }
  } catch (e) {
    console.log(e.stdout || '');
    console.error(`❌ ${suite.name} FAILED with exit code ${e.status}`);
    
    const match = (e.stdout || '').match(/(\d+) passed, (\d+) failed/);
    if (match) {
      totalPassed += parseInt(match[1]);
      totalFailed += parseInt(match[2]);
      results.push({ name: suite.name, status: 'FAIL', passed: parseInt(match[1]), failed: parseInt(match[2]) });
    } else {
      totalFailed++;
      results.push({ name: suite.name, status: 'ERROR', error: e.message?.substring(0, 100) });
    }
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

// ══════════════════════════════════════════════════════
// CONSOLIDATED REPORT
// ══════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log('  📊 CONSOLIDATED TEST REPORT — V9.0-Omega');
console.log('═'.repeat(60));
console.log('');
console.log('  Suite Results:');
console.log('  ' + '─'.repeat(56));
for (const r of results) {
  const icon = r.status === 'PASS' ? '✅' : r.status === 'SKIPPED' ? '⏭️' : '❌';
  const detail = r.passed !== undefined ? `(${r.passed} passed, ${r.failed} failed)` : (r.reason || r.error || '');
  console.log(`  ${icon} ${r.name} ${detail}`);
}
console.log('  ' + '─'.repeat(56));
console.log(`\n  🎯 Total: ${totalPassed} passed, ${totalFailed} failed, ${totalPassed + totalFailed} total`);
console.log(`  ⏱️  Time: ${elapsed}s`);

if (totalFailed === 0) {
  console.log('\n  ✅ ALL SUITES PASSED — SYSTEM READY FOR DEPLOYMENT\n');
} else {
  console.log(`\n  ❌ ${totalFailed} TEST(S) FAILED — REVIEW REQUIRED\n`);
  process.exit(1);
}

// Write markdown report
const reportPath = path.join(__dirname, 'test-results', `report_${Date.now()}.md`);
try {
  fs.mkdirSync(path.join(__dirname, 'test-results'), { recursive: true });
  const md = [
    `# 🧪 Test Report — Nexus Engine V9.0-Omega`,
    `> Generated: ${new Date().toISOString()} | Duration: ${elapsed}s`,
    '',
    '| Suite | Status | Passed | Failed |',
    '| :--- | :--- | :--- | :--- |',
    ...results.map(r => `| ${r.name} | ${r.status === 'PASS' ? '✅' : '❌'} ${r.status} | ${r.passed || 0} | ${r.failed || 0} |`),
    '',
    `**Total: ${totalPassed} passed, ${totalFailed} failed**`,
    '',
    totalFailed === 0 ? '> [!TIP]\n> All tests passed. System is deployment-ready.' : '> [!CAUTION]\n> Some tests failed. Review required before deployment.',
  ].join('\n');
  fs.writeFileSync(reportPath, md, 'utf8');
  console.log(`  📄 Report saved to: ${reportPath}\n`);
} catch (e) {
  // Non-critical — report is just for convenience
}
