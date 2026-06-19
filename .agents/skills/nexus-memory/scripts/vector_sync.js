const fs = require("fs");
const path = require("path");

// Vector Memory Sync Continuum for Sovereign V18.0
// Scans the .agents/memory directories and updates vector_index.json
// V18.0: Added syncFromGraph to merge GraphMemoryEngine dependency data
class VectorSync {
  constructor() {
    this.memoryDir = path.resolve(process.cwd(), ".agents", "memory");
    this.indexFile = path.join(this.memoryDir, "vector_index.json");
  }

  sync() {
    console.log("[VectorSync] Initiating Semantic Memory Consolidation...");

    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }

    const files = ["decisions.md", "patterns.md", "bugs.md"];
    const memoryDatabase = [];

    files.forEach((file) => {
      const filePath = path.join(this.memoryDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        const sections = content.split(/^## /m).slice(1);

        sections.forEach((section) => {
          const lines = section.split("\n");
          const title = lines[0].trim();
          const body = lines.slice(1).join("\n").trim();

          if (title && body) {
            memoryDatabase.push({
              id: `${file}#${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              source: file,
              title: title,
              content: body,
              timestamp: new Date().toISOString(),
            });
          }
        });
      }
    });

    // Preserve any existing graph nodes
    let existingGraphNodes = [];
    if (fs.existsSync(this.indexFile)) {
      try {
        const existing = JSON.parse(fs.readFileSync(this.indexFile, "utf8"));
        existingGraphNodes = existing.filter(
          (e) => e.source === "GraphMemoryEngine",
        );
      } catch (e) {
        /* ignore parse errors */
      }
    }

    const merged = [...memoryDatabase, ...existingGraphNodes];
    fs.writeFileSync(this.indexFile, JSON.stringify(merged, null, 2), "utf8");
    console.log(
      `[VectorSync] Memory consolidated. Indexed ${merged.length} nodes (${memoryDatabase.length} semantic + ${existingGraphNodes.length} graph).`,
    );
  }

  /**
   * Merge dependency graph data from GraphMemoryEngine into vector_index.json
   * @param {Object} graphData - Map of { filePath: { dependencies: [], dependents: [] } }
   */
  syncFromGraph(graphData) {
    console.log(
      "[VectorSync] Syncing dependency graph into semantic memory...",
    );
    const graphNodes = [];

    for (const [file, data] of Object.entries(graphData)) {
      const deps = (data.dependencies || []).join(", ") || "none";
      const depts = (data.dependents || []).join(", ") || "none";
      graphNodes.push({
        id: `graph#${file.replace(/[^a-z0-9]+/gi, "-")}`,
        source: "GraphMemoryEngine",
        title: `Dependencies: ${path.basename(file)}`,
        content: `File: ${file}\nDepends on: ${deps}\nDepended by: ${depts}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Merge with existing index (replace old graph nodes, keep semantic nodes)
    let existing = [];
    if (fs.existsSync(this.indexFile)) {
      try {
        existing = JSON.parse(fs.readFileSync(this.indexFile, "utf8"));
      } catch (e) {
        /* ignore */
      }
    }
    const filtered = existing.filter((e) => e.source !== "GraphMemoryEngine");
    const merged = [...filtered, ...graphNodes];
    fs.writeFileSync(this.indexFile, JSON.stringify(merged, null, 2), "utf8");
    console.log(
      `[VectorSync] Graph merged. Total nodes: ${merged.length} (${filtered.length} semantic + ${graphNodes.length} graph).`,
    );
  }
}

module.exports = VectorSync;

if (require.main === module) {
  const syncer = new VectorSync();
  syncer.sync();
}
