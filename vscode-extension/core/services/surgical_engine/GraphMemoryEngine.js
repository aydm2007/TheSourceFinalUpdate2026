/**
 * GraphMemoryEngine.js — Sovereign Sigma V12.0
 * --------------------------------------------
 * محرك ذاكرة الرسم البياني الذي يربط بين المكونات والتبعيات.
 */
class GraphMemoryEngine {
    constructor() {
        this.graph = new Map();
    }

    indexProject(files) {
        console.log(`[GraphMemoryEngine] Indexing ${files.length} nodes into dependency web...`);
        // Logic to parse imports and build graph
        files.forEach(f => {
            this.graph.set(f.path, {
                dependencies: f.imports || [],
                dependents: []
            });
        });
        this.computeDependents();
    }

    computeDependents() {
        for (const [file, data] of this.graph.entries()) {
            data.dependencies.forEach(dep => {
                if (this.graph.has(dep)) {
                    this.graph.get(dep).dependents.push(file);
                }
            });
        }
    }

    getImpactedNodes(targetFile) {
        const node = this.graph.get(targetFile);
        return node ? node.dependents : [];
    }
}

module.exports = GraphMemoryEngine;
