const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function demoSynapseV2() {
    console.error("=== Launching Alpha-Synapse V2 Live Demo ===");

    try {
        console.error("\n[1] Fetching Live Linter Diagnostics from IDE...");
        let resp = await axios.get('http://localhost:9998/diagnostics');
        console.error("Diagnostics Received (Squiggles):", JSON.stringify(resp.data.diagnostics).substring(0, 300) + "...");

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
        
        const originalPath = path.join(os.tmpdir(), 'sovereign_original.js');
        const modifiedPath = path.join(os.tmpdir(), 'sovereign_modified.js');
        fs.writeFileSync(originalPath, originalContent);
        fs.writeFileSync(modifiedPath, modifiedContent);

        let diffResp = await axios.post('http://localhost:9998/send', { 
            action: 'OPEN_DIFF',
            payload: { original: originalPath, modified: modifiedPath, title: "Sovereign AI VS Legacy Code" }
        });
        console.error("Diff Command Sent:", diffResp.data);

        console.error("\n[3] Testing Native Snippet Injection...");
        let snippetResp = await axios.post('http://localhost:9998/send', {
            action: 'INSERT_SNIPPET',
            payload: { snippet: "\\nconsole.error('${1:Sovereign}', '${2:AI}');\\n" }
        });
        console.error("Snippet Command Sent:", snippetResp.data);

        console.error("\n[!] Please look at your IDE. The Diff View should be open, and a snippet injected!");

    } catch (e) {
        console.error("Demo failed:", e.message);
    }
}

demoSynapseV2();
