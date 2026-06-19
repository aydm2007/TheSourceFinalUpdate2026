const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("==================================================");
console.log("🐛 [Queue Repair Swarm] STARTING EXECUTION");
console.log("==================================================");

// 1. Code Surgeon Task: Fix Queue instantiation in core/bridge/handlers/swarm_handlers.js
try {
    const filePath = path.join(__dirname, '..', 'core', 'bridge', 'handlers', 'swarm_handlers.js');
    console.log(`[Code Surgeon] Repairing file at: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Queue with queue
    const oldBlock = "  const { Queue } = require('async');\r\n  const taskQueue = new Queue(async (task, callback) => {";
    const newBlock = "  const { queue } = require('async');\r\n  const taskQueue = queue(async (task, callback) => {";
    
    // Fallback for LF line endings just in case
    const oldBlockLF = "  const { Queue } = require('async');\n  const taskQueue = new Queue(async (task, callback) => {";
    const newBlockLF = "  const { queue } = require('async');\n  const taskQueue = queue(async (task, callback) => {";
    
    if (content.includes(oldBlock)) {
        content = content.replace(oldBlock, newBlock);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Code Surgeon] Successfully repaired async queue usage (CRLF)!`);
    } else if (content.includes(oldBlockLF)) {
        content = content.replace(oldBlockLF, newBlockLF);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Code Surgeon] Successfully repaired async queue usage (LF)!`);
    } else {
        // Direct string replacement for safety
        content = content.replace("const { Queue } = require('async');", "const { queue } = require('async');");
        content = content.replace("const taskQueue = new Queue(async (task, callback)", "const taskQueue = queue(async (task, callback)");
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`[Code Surgeon] Replaced queue strings directly.`);
    }
} catch (e) {
    console.error(`[Code Surgeon] Error editing swarm_handlers.js:`, e.message);
}

// 2. QA Validator Task: Run Vitest on the failing file to verify
try {
    console.log(`[QA Validator] Testing mcp_policy.test.js...`);
    const result = execSync('npx vitest run tests/mcp_policy.test.js', { encoding: 'utf8' });
    console.log(`[QA Validator] Test results:\n`, result);
} catch (e) {
    console.error(`[QA Validator] Test failed:`, e.message);
}

console.log("\n==================================================");
console.log("🏁 [Queue Repair Swarm] WORK COMPLETE");
console.log("==================================================");
