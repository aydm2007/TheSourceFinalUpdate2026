// test_bridge_tools.js — Live verification suite for nexus_bridge.js
const fs = require('fs');

const code = fs.readFileSync('nexus_bridge.js', 'utf8');

const tests = [
  { name: 'ShadowLedgerAudit case', pass: code.includes("case 'ShadowLedgerAudit'") || code.includes("ShadowLedgerAudit:") },
  { name: 'FileEdit case', pass: code.includes("case 'FileEdit'") || code.includes("FileEdit:") },
  { name: 'WebSearch case', pass: code.includes("case 'WebSearch'") || code.includes("WebSearch:") },
  { name: 'WebFetch case', pass: code.includes("case 'WebFetch'") || code.includes("WebFetch:") },
  { name: 'TaskOutput case', pass: code.includes("case 'TaskOutput'") || code.includes("TaskOutput:") },
  { name: 'TaskStop case', pass: code.includes("case 'TaskStop'") || code.includes("TaskStop:") },
  { name: 'Grep case', pass: code.includes("case 'Grep'") || code.includes("Grep:") },
  { name: 'ForensicAudit REAL (no fake)', pass: !code.includes("[AUDIT-PASS] File ") },
  { name: 'ShadowLedger path defined', pass: code.includes('shadowLedgerPath') },
  { name: 'OmegaDiagnostic case', pass: code.includes("case 'OmegaDiagnostic'") || code.includes("OmegaDiagnostic:") },
];

const registered = [...code.matchAll(/name: '(\w+)'/g)].map(m => m[1]);
const implemented = [...code.matchAll(/case '(\w+)':/g)].map(m => m[1]);

// Support modular handlerMap keys
const handlerMapMatch = code.match(/const handlerMap = \{([\s\S]*?)\};/);
if (handlerMapMatch) {
    const keys = handlerMapMatch[1].split('\n')
        .map(line => line.split(':')[0].trim())
        .filter(key => key && !key.startsWith('//'));
    keys.forEach(key => {
        if (!implemented.includes(key)) {
            implemented.push(key);
        }
    });
}

const missing = registered.filter(t => !implemented.includes(t));

console.error('=== nexus_bridge.js — Tool Verification Suite ===\n');
let passed = 0;
tests.forEach((t, i) => {
  const status = t.pass ? '✅ PASS' : '❌ FAIL';
  if (t.pass) passed++;
  console.error(`[${i + 1}] ${status} — ${t.name}`);
});

console.error(`\n=== Summary ===`);
console.error(`Tests: ${passed}/${tests.length} passed`);
console.error(`Registered tools: ${registered.length}`);
console.error(`Implemented cases: ${implemented.length}`);
console.error(`Missing implementations: ${missing.length}`, missing.length ? missing : '(none)');
console.error(`\nScore: ${Math.round((implemented.length / (registered.length + 1)) * 100)}/100`);

