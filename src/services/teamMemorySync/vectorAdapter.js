const fs = require("fs");
const path = require("path");

class VectorMemoryAdapter {
  constructor(workspaceRoot) {
    this.memoryDir = path.join(workspaceRoot, ".agents", "memory");
    this.outputPath = path.join(this.memoryDir, "vector_index.json");
  }

  async vectorize() {
    console.log(`[Apex] Scanning memory directory: ${this.memoryDir}`);

    if (!fs.existsSync(this.memoryDir)) {
      console.error(`[Apex] Memory directory not found: ${this.memoryDir}`);
      return;
    }

    const files = fs
      .readdirSync(this.memoryDir)
      .filter((f) => f.endsWith(".md"));
    const vectorData = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(this.memoryDir, file), "utf-8");
      const chunks = this.parseMarkdown(content);
      vectorData.push(...chunks);
    }

    console.log(
      `[Apex] Saving ${vectorData.length} chunks to ${this.outputPath}`,
    );
    fs.writeFileSync(
      this.outputPath,
      JSON.stringify(vectorData, null, 2),
      "utf-8",
    );
    console.log("[Apex] Vectorization complete (Pure JS Native).");
  }

  parseMarkdown(content) {
    const chunks = [];
    const sections = content.split(/##\s+/);

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.trim().split("\n");
      const header = lines[0] || "unknown";
      const body = lines.slice(1).join("\n");

      const dateMatch = header.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : "unknown";

      chunks.push({
        id: `chunk_${Date.now()}_${chunks.length}`,
        date: date || "unknown",
        title: header,
        content: body,
        metadata: {
          source: "memory",
          type: header.toLowerCase().includes("decision")
            ? "decision_log"
            : "pattern",
        },
      });
    }
    return chunks;
  }
}

module.exports = { VectorMemoryAdapter };
