const fs = require('fs');
const path = require('path');
const { SurgicalDiff } = require('./core/bridge/handlers/file_handlers');
const VectorEngine = require('./core/services/memory_engine/VectorEngine');

async function testAll() {
    console.error("=== Testing VectorEngine ===");
    const engine = new VectorEngine(__dirname);
    engine.sync([
        { id: '1', text: 'This is a test document about AST and babel parsing.' },
        { id: '2', text: 'Another document regarding vector similarity.' },
        { id: '3', text: 'Totally unrelated financial data.' }
    ]);
    const res = engine.search('AST parsing');
    console.error("Vector Search Results:", res);
    
    console.error("\n=== Testing SurgicalDiff PredictiveForesight ===");
    const testFile = path.join(__dirname, 'scratch', 'test_omni.js');
    if (!fs.existsSync(path.dirname(testFile))) fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, 'function test() {\n  return true;\n}', 'utf8');
    
    // Fake context
    const context = {
        AgentContext: { readFiles: new Set([testFile]) },
        logShadow: (log) => console.error("[ShadowLedger Log]", log)
    };
    
    // Test a valid replacement
    const validResult = await SurgicalDiff({
        file_path: testFile,
        search_block: 'return true;',
        replace_block: 'return false;'
    }, context);
    console.error("Valid Patch Result:", validResult);
    
    // Test a broken replacement (Syntax Error)
    const invalidResult = await SurgicalDiff({
        file_path: testFile,
        search_block: 'return false;',
        replace_block: 'return false; {' // syntax error
    }, context);
    console.error("Invalid Patch Result:", invalidResult);
    
    // Check if original file is intact
    const finalContent = fs.readFileSync(testFile, 'utf8');
    console.error("\nFinal File Content (Should NOT contain syntax error):\n" + finalContent);
}

testAll().catch(console.error);
