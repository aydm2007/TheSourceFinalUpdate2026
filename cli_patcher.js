const fs = require('fs');
const path = require('path');
const RemoteMapDecoder = require('./remote_map_decoder.js');

class CLIPatcher {
    constructor(cliPath, mapPath) {
        this.cliPath = cliPath;
        this.mapPath = mapPath;
    }

    async patch() {
        console.error(`[Omega-Synapse] Starting Monkey-Patching sequence...`);
        
        if (!fs.existsSync(this.cliPath)) {
            throw new Error(`CLI file not found: ${this.cliPath}`);
        }

        // 1. Take Backup
        const backupPath = `${this.cliPath}.bak`;
        if (!fs.existsSync(backupPath)) {
            fs.copyFileSync(this.cliPath, backupPath);
            console.error(`[Omega-Synapse] Backup created at ${backupPath}`);
        } else {
            console.error(`[Omega-Synapse] Backup already exists. Skipping backup.`);
        }

        // 2. Decode Map and Generate Payload
        const decoder = new RemoteMapDecoder(this.mapPath);
        await decoder.load();
        const signatures = decoder.findTargetSignatures();
        
        if (signatures.length === 0) {
            console.error(`[Omega-Synapse] No viable signatures found. Aborting patch.`);
            return false;
        }

        let patchPayload = decoder.generatePatchPayload(signatures);

        // 3. Inject Actual Proxy Hooks
        patchPayload += `
// [SOVEREIGN INJECTION - MOUSE & SCROLL HOOKS]
if (typeof process !== 'undefined' && !global.__SOVEREIGN_HOOKED__) {
    global.__SOVEREIGN_HOOKED__ = true;
    
    // Attempting to hook into MouseEvents
    try {
        const originalMouseEvent = global.MouseEvent;
        if (originalMouseEvent) {
            global.MouseEvent = function(...args) {
                if (global.AgriAssetSovereign && global.AgriAssetSovereign.ws) {
                    try {
                        global.AgriAssetSovereign.ws.send(JSON.stringify({
                            type: 'IDE_TELEMETRY',
                            payload: { event: 'MOUSE_INTERCEPTED', args: args }
                        }));
                    } catch(e) {}
                }
                return new originalMouseEvent(...args);
            };
        }
    } catch(e) {}
}
// [/SOVEREIGN INJECTION]
`;

        // 4. Write to CLI
        let cliContent = fs.readFileSync(this.cliPath, 'utf8');
        
        // Prevent double patching
        if (cliContent.includes('[SOVEREIGN INJECTION - MOUSE & SCROLL HOOKS]')) {
            console.error(`[Omega-Synapse] File is already patched.`);
            return true;
        }

        // Inject at the very top
        cliContent = patchPayload + "\n" + cliContent;
        
        fs.writeFileSync(this.cliPath, cliContent);
        console.error(`[Omega-Synapse] Nucleus successfully injected! 66-Feature Conquest initiated.`);
        return true;
    }

    restore() {
        const backupPath = `${this.cliPath}.bak`;
        if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, this.cliPath);
            console.error(`[Omega-Synapse] Restored CLI from backup.`);
            return true;
        }
        console.error(`[Omega-Synapse] No backup found to restore.`);
        return false;
    }
}

module.exports = CLIPatcher;

// Auto-run if executed directly
if (require.main === module) {
    const cliPath = path.join(__dirname, 'vscode-extension', 'package', 'cli.js');
    const mapPath = path.join(__dirname, 'vscode-extension', 'package', 'cli.js.map');
    const patcher = new CLIPatcher(cliPath, mapPath);
    patcher.patch().catch(console.error);
}
