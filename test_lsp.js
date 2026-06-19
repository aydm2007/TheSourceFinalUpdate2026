const { executeTool } = require('./nexus_bridge.js');
const path = require('path');

async function testLsp() {
    console.error("=== Testing Sovereign LSP Agent (AST Query) ===");
    try {
        const targetFile = path.join(__dirname, 'nervous_system_server.js');
        
        console.error(`Querying NavTree for: ${targetFile}`);
        
        const result = await executeTool('AstLspQuery', {
            action: 'navtree',
            file: targetFile
        });
        
        const parsed = JSON.parse(result);
        
        if (parsed && parsed.childItems) {
            console.error("\n[SUCCESS] AST NavTree retrieved from TypeScript Compiler!");
            console.error(`Found ${parsed.childItems.length} top-level nodes.`);
            parsed.childItems.forEach(item => {
                console.error(`- [${item.kind}] ${item.text}`);
            });
        } else {
            console.error(result);
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testLsp();
