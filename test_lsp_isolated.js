const SovereignLSPAgent = require('./sovereign_lsp_agent.js');
const path = require('path');

async function testLspIsolated() {
    console.error("=== Testing Sovereign LSP Agent (Isolated) ===");
    const lsp = new SovereignLSPAgent(process.cwd());
    
    try {
        console.error("Starting LSP Server...");
        await lsp.start();
        
        const targetFile = path.join(__dirname, 'nervous_system_server.js');
        console.error(`Opening file in memory: ${targetFile}`);
        await lsp.openFile(targetFile);
        
        console.error("Requesting AST NavTree...");
        const result = await lsp.getNavTree(targetFile);
        
        if (result && result.childItems) {
            console.error("\n[SUCCESS] AST NavTree retrieved from TypeScript Compiler!");
            console.error(`Found ${result.childItems.length} top-level nodes.`);
            result.childItems.forEach(item => {
                console.error(`- [${item.kind}] ${item.text}`);
            });
        } else {
            console.error("Unexpected result:", result);
        }
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        lsp.stop();
    }
}

testLspIsolated();
