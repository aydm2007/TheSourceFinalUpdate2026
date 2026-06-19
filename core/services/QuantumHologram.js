const fs = require('fs');
const path = require('path');

class QuantumHologram {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Constructs an abstract architectural graph (Mermaid) representing the 11-layer execution tree.
     */
    async constructAbstractArchitectureGraph(targetDir, depth = 3) {
        const fullDir = path.resolve(this.workspaceRoot, targetDir || '');
        if (!fs.existsSync(fullDir)) return `[Hologram Error] Target directory not found: ${fullDir}`;

        let mermaidGraph = `graph TD\n`;
        mermaidGraph += `    %% [V51.0-Singularity] Quantum Hologram Abstract Map\n`;
        mermaidGraph += `    subgraph "${path.basename(fullDir)} Hologram"\n`;

        let nodeId = 0;
        const idMap = new Map();

        const walk = (dir, currentDepth) => {
            if (currentDepth > depth) return;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (['node_modules', '.git', 'dist', 'coverage', '.nexus'].includes(entry.name)) continue;
                
                const fp = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walk(fp, currentDepth + 1);
                } else if (['.js', '.ts', '.py'].includes(path.extname(entry.name))) {
                    nodeId++;
                    const id = `N${nodeId}`;
                    idMap.set(fp, id);
                    mermaidGraph += `        ${id}["${entry.name}"]\n`;
                }
            }
        };

        walk(fullDir, 1);

        mermaidGraph += `    end\n`;
        
        // Add style for premium sovereign aesthetic
        mermaidGraph += `    classDef default fill:#1e1e1e,stroke:#3b82f6,stroke-width:2px,color:#fff;\n`;

        return `[QuantumHologram] Abstract Architectural Graph Generated Successfully:\n\n\`\`\`mermaid\n${mermaidGraph}\n\`\`\``;
    }
}

module.exports = QuantumHologram;
