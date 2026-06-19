const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.error("🧪 Starting Forensic Plugin Audit...");

// 1. Verify Shadow Ledger Initialization
const shadowLedgerPath = path.join(__dirname, '..', 'scratch', 'shadow_ledger.jsonl');
if (fs.existsSync(shadowLedgerPath)) {
    console.error("✅ Shadow Ledger active.");
} else {
    console.error("⚠️ Shadow Ledger missing. Starting bridge to initialize...");
    try {
        execSync('node nexus_bridge.js "Verify Ledger Initialization"', { cwd: path.join(__dirname, '..'), timeout: 5000 });
    } catch (e) { /* ignore timeout */ }
}

// 2. Verify Tool Integrity
try {
    const output = execSync('node nexus_bridge.js OmegaDiagnostic', { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    if (output.includes("ZERO_EXIT_CONFIRMED")) {
        console.error("✅ OmegaDiagnostic passed.");
    } else {
        console.error("❌ OmegaDiagnostic failed.");
    }
} catch (e) {
    console.error("❌ Bridge Execution Failed:", e.message);
}

// 3. Verify Anti-Pattern Blocking
const shadowMemoryPath = path.join(__dirname, '..', 'shadow_memory.json');
const originalShadow = fs.existsSync(shadowMemoryPath) ? fs.readFileSync(shadowMemoryPath, 'utf8') : '{}';

fs.writeFileSync(shadowMemoryPath, JSON.stringify({
    anti_patterns: ["RECURSIVE_DELETE_CRITICAL"]
}));

try {
    const jsonArgs = JSON.stringify({ command: "rm -rf RECURSIVE_DELETE_CRITICAL" }).replace(/"/g, '\\"');
    const output = execSync(`node nexus_bridge.js Bash "${jsonArgs}"`, { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    if (output.includes("[FORENSIC-BLOCK]")) {
        console.error("✅ Anti-Pattern Blocking passed.");
    } else {
        console.error("❌ Anti-Pattern Blocking failed. Output:", output);
    }
} catch (e) {
    if (e.stdout && e.stdout.includes("[FORENSIC-BLOCK]")) {
        console.error("✅ Anti-Pattern Blocking passed (via error pipe).");
    } else {
    }
}

// 4. Verify Zod Schema Enforcement
console.error("🧪 Testing Zod Schema Enforcement...");
try {
    const invalidArgs = JSON.stringify({ file_path: 123, old_string: "foo", new_string: "bar" }).replace(/"/g, '\\"');
    const output = execSync(`node nexus_bridge.js FileEdit "${invalidArgs}"`, { encoding: 'utf8', cwd: path.join(__dirname, '..') });
    if (output.includes("[SCHEMA-ERROR]")) {
        console.error("✅ Zod Schema Enforcement passed.");
    } else {
        console.error("❌ Zod Schema Enforcement failed. Output:", output);
    }
} catch (e) {
    if (e.stdout && e.stdout.includes("[SCHEMA-ERROR]")) {
        console.error("✅ Zod Schema Enforcement passed (via error pipe).");
    } else {
        console.error("❌ Schema Test Failed:", e.message);
    }
}

// Restore shadow memory
fs.writeFileSync(shadowMemoryPath, originalShadow);

console.error("🏁 Audit Complete.");
