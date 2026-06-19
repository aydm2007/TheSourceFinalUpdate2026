const RemoteMapDecoder = require('./remote_map_decoder.js');
const path = require('path');

async function testDecoder() {
    console.error("=== Testing Remote Map Decoder ===");
    try {
        const mapPath = path.join(__dirname, 'vscode-extension', 'package', 'cli.js.map');
        const decoder = new RemoteMapDecoder(mapPath);
        
        console.error(`Loading map from: ${mapPath}`);
        await decoder.load();
        
        const signatures = decoder.findTargetSignatures();
        console.error(`\nFound ${signatures.length} target signatures in map.`);
        
        signatures.forEach(sig => {
            console.error(`- Target: ${sig.target} | Source: ${sig.sourceFile}`);
        });

        console.error("\nGenerated Patch Payload:");
        console.error(decoder.generatePatchPayload(signatures));
    } catch (e) {
        console.error("Decoder Error:", e.message);
    }
}

testDecoder();
