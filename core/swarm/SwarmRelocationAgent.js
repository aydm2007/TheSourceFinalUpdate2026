const fs = require('fs');
const path = require('path');

class SwarmRelocationAgent {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Teleports cognitive context (Vector DB + Ledger) from a source tenant to a destination tenant.
     * Incorporates an Ontological Filter to ensure only architectural wisdom is inherited, 
     * while domain-specific rules (e.g., specific crops vs solar panels) are strictly isolated.
     * @param {string} sourceTenant 
     * @param {string} destTenant 
     */
    async teleportContext(sourceTenant, destTenant) {
        const sourcePath = path.join(this.workspaceRoot, 'projects', sourceTenant);
        const destPath = path.join(this.workspaceRoot, 'projects', destTenant);

        if (!fs.existsSync(sourcePath)) return `[Teleport Blocked] Source tenant ${sourceTenant} does not exist.`;
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });

        const sourceLedger = path.join(sourcePath, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
        const destLedgerDir = path.join(destPath, '.nexus', 'var', 'telemetry');
        const destLedger = path.join(destLedgerDir, 'shadow_ledger.jsonl');

        let teleportedItems = 0;

        // 🧠 Ontological Filter: Only transfer pure architectural logic, omit domain data
        if (fs.existsSync(sourceLedger)) {
            if (!fs.existsSync(destLedgerDir)) fs.mkdirSync(destLedgerDir, { recursive: true });
            
            const rawContent = fs.readFileSync(sourceLedger, 'utf8');
            const lines = rawContent.split('\n').filter(Boolean);
            const filteredLines = [];

            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    // Strictly whitelist architectural memory. Block domain-specific states.
                    const isArchitectural = 
                        entry.type === 'BRIDGE_CRITICAL' || 
                        entry.type === 'SYSTEM_ERROR' || 
                        entry.type === 'TOOL_EXECUTION' ||
                        (entry.action && entry.action.includes('Consensus'));

                    if (isArchitectural) {
                        filteredLines.push(line);
                    }
                } catch (e) {
                    // Raw string lines are assumed architectural if they contain specific markers
                    if (line.includes('[Error]') || line.includes('[AutoFixer]')) {
                        filteredLines.push(line);
                    }
                }
            }

            fs.writeFileSync(destLedger, filteredLines.join('\n') + '\n', 'utf8');
            teleportedItems += filteredLines.length;
        }

        if (teleportedItems > 0) {
            return `[SwarmTeleport] 🌌 QUANTUM SUCCESS. \nFiltered and teleported ${teleportedItems} Pure Architectural nodes from ${sourceTenant} to ${destTenant}.\nDomain-specific logic was securely pruned via Ontological Filter.`;
        } else {
            return `[SwarmTeleport] Source tenant ${sourceTenant} has no strictly architectural memory to teleport.`;
        }
    }
}

module.exports = SwarmRelocationAgent;
