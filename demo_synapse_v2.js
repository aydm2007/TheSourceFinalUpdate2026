const { executeTool } = require('./nexus_bridge.js');

async function demoSynapseV2() {
    console.error("=== Launching Alpha-Synapse V2 Live Demo ===");

    try {
        console.error("\n[1] Fetching Live Linter Diagnostics from IDE...");
        let squiggles = await executeTool('GetLinterSquiggles', {});
        console.error("Diagnostics Received (Squiggles):", squiggles.substring(0, 300) + "...");

        console.error("\n[2] Triggering Native Diff View in IDE...");
        const originalContent = `function hello() {
    console.error("Hello Legacy World!");
    return false;
}`;
        const modifiedContent = `function hello() {
    // Upgraded by Alpha-Synapse V2 🚀
    console.error("Hello Sovereign World!");
    return true;
}`;
        
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const originalPath = path.join(os.tmpdir(), 'sovereign_original.js');
        fs.writeFileSync(originalPath, originalContent);

        let diff = await executeTool('IdeDiffView', { 
            original_file: originalPath, 
            modified_content: modifiedContent, 
            title: "Sovereign AI VS Legacy Code" 
        });
        console.error("Diff Command Sent:", diff);
        console.error("\n[!] Please look at your IDE. A 3-Way Merge Diff View should have opened!");

    } catch (e) {
        console.error("Demo failed:", e);
    }
}

demoSynapseV2();
