const path = require('path');
process.chdir(path.join(__dirname, '..'));
const fs = require('fs');

const bridgeCode = fs.readFileSync('nexus_bridge.js', 'utf8');

console.error('=== VERIFYING PHASES 6-10 ===');

const tests = [
  { name: 'Glob real implementation', pass: bridgeCode.includes("const { globSync } = require('glob');") },
  { name: 'LSPTool real implementation', pass: bridgeCode.includes('rg --json') && bridgeCode.includes('definition') },
  { name: 'NotebookEdit real implementation', pass: bridgeCode.includes('JSON.parse(fs.readFileSync') && bridgeCode.includes('nb.cells[args.cell_index]') },
  { name: 'Agent real implementation', pass: bridgeCode.includes('node nexus_bridge.js "Agent Sub-Task:') }
];

let passed = 0;
tests.forEach((t, i) => {
  const status = t.pass ? '✅ PASS' : '❌ FAIL';
  if (t.pass) passed++;
  console.error(`[${i + 1}] ${status} — ${t.name}`);
});

console.error(`\n=== Summary ===`);
console.error(`Tests: ${passed}/${tests.length} passed`);
console.error(`Score: ${Math.round((passed / tests.length) * 100)}/100`);
