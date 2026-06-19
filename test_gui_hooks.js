const { executeTool } = require('./nexus_bridge.js');

async function testGUIHooks() {
    console.error("=== Testing Project Alpha-Synapse V2 GUI Hooks ===");

    try {
        console.error("\n[1] Testing GetLinterSquiggles...");
        let squiggles = await executeTool('GetLinterSquiggles', {});
        console.error("Response:", squiggles);

        console.error("\n[2] Testing InsertNativeSnippet...");
        let snippet = await executeTool('InsertNativeSnippet', { snippet: "console.error('${1:Hello}', ${2:World});" });
        console.error("Response:", snippet);

        console.error("\n[3] Testing IdeDiffView...");
        let diff = await executeTool('IdeDiffView', { 
            original_file: "c:\\tools\\workspace\\TheSource\\test.js", 
            modified_content: "console.error('Modified by Sovereign AI');", 
            title: "Sovereign AI Diff Test" 
        });
        console.error("Response:", diff);

        console.error("\n[4] Testing CaptureIdeScreenshot...");
        let screenshot = await executeTool('CaptureIdeScreenshot', {});
        console.error("Response:", screenshot);

    } catch (e) {
        console.error("Test failed:", e);
    }
}

testGUIHooks();
