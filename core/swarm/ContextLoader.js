const fs = require('fs');
const path = require('path');

class ContextLoader {
    constructor(baseDir) {
        this.baseDir = baseDir || process.cwd();
        this.teleportFile = path.join(this.baseDir, '.teleport_context.json');
        this.memoryDir = path.join(this.baseDir, '.agents', 'memory');
    }

    checkAndLoad() {
        if (!fs.existsSync(this.teleportFile)) {
            return false;
        }

        try {
            console.error('[SWARM-TELEPORT] Teleport Context detected. Absorbing memory buffers...');
            const data = JSON.parse(fs.readFileSync(this.teleportFile, 'utf8'));
            
            if (!fs.existsSync(this.memoryDir)) {
                fs.mkdirSync(this.memoryDir, { recursive: true });
            }

            // Restore the context to a state file
            const statePath = path.join(this.memoryDir, 'teleported_state.md');
            let content = `# Teleported Context State\n\n**Timestamp:** ${data.timestamp}\n\n`;
            
            if (data.keys) {
                content += `## Synchronized Keys\n- ${data.keys.join('\n- ')}\n\n`;
            }

            if (data.payload) {
                content += `## Payload Buffer\n\`\`\`json\n${JSON.stringify(data.payload, null, 2)}\n\`\`\`\n`;
            }

            fs.writeFileSync(statePath, content, 'utf8');

            // Apply environment variables if present in payload
            if (data.payload && data.payload.env) {
                for (const [k, v] of Object.entries(data.payload.env)) {
                    process.env[k] = v;
                }
            }

            // Clean up the teleport file to prevent duplicate loading on next boot
            fs.unlinkSync(this.teleportFile);
            console.error('[SWARM-TELEPORT] Memory successfully materialized. Agent context fully synced.');
            return true;
        } catch (e) {
            console.error(`[SWARM-TELEPORT-ERROR] Failed to load teleport context: ${e.message}`);
            return false;
        }
    }
}

module.exports = { ContextLoader };
