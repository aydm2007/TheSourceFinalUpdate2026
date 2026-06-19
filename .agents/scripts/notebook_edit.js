/**
 * 🟣 NotebookEdit — Sovereign Notebook Editor for Aether Engine V11.0
 * Part of: Phase 2 — 85 → 92 (Final service)
 *
 * Usage: node notebook_edit.js --cmd=create|append|read|list [--notebook=name] [--content=...]
 * Manages structured notebooks for session logging, code experiments, and audit trails.
 */

const fs = require("fs");
const path = require("path");

const NOTEBOOKS_DIR = path.join(__dirname, "..", "memory", "notebooks");

class NotebookEdit {
  constructor() {
    this.ensureDir();
  }

  ensureDir() {
    if (!fs.existsSync(NOTEBOOKS_DIR)) {
      fs.mkdirSync(NOTEBOOKS_DIR, { recursive: true });
    }
  }

  // ─── Notebook Management ────────────────────────────────

  create(name, metadata = {}) {
    const safeName = name.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, "_");
    const filePath = path.join(NOTEBOOKS_DIR, `${safeName}.md`);

    if (fs.existsSync(filePath)) {
      return {
        success: false,
        error: `Notebook already exists: ${safeName}`,
        path: filePath,
      };
    }

    const header = `# 📓 ${name}
> **Aether Engine V11.0** | **Created**: ${new Date().toISOString()}
> **Type**: ${metadata.type || "session"} | **Tags**: ${(metadata.tags || []).join(", ")}

---

`;

    fs.writeFileSync(filePath, header);
    return { success: true, notebook: safeName, path: filePath, created: true };
  }

  // ─── Cell Operations ────────────────────────────────────

  appendCell(name, cell) {
    const filePath = this.resolvePath(name);
    if (!filePath)
      return { success: false, error: `Notebook not found: ${name}` };

    const timestamp = new Date().toISOString();
    let content = "";

    switch (cell.type) {
      case "code":
        content = `\n### 💻 Code Cell — ${timestamp}\n\`\`\`${cell.language || "javascript"}\n${cell.content}\n\`\`\`\n`;
        break;
      case "markdown":
        content = `\n### 📝 Note — ${timestamp}\n${cell.content}\n`;
        break;
      case "output":
        content = `\n### 📤 Output — ${timestamp}\n\`\`\`\n${cell.content}\n\`\`\`\n`;
        break;
      case "decision":
        content = `\n### 🧠 Decision — ${timestamp}\n> **Decision**: ${cell.decision || cell.content}\n> **Reason**: ${cell.reason || ""}\n> **Alternatives**: ${cell.alternatives || ""}\n`;
        break;
      case "error":
        content = `\n### ❌ Error — ${timestamp}\n\`\`\`\n${cell.content}\n\`\`\`\n> **Resolution**: ${cell.resolution || "Pending"}\n`;
        break;
      case "telepathy":
        content = `\n### 🟣 Telepathy Pulse — ${timestamp}\n\`\`\`json\n${typeof cell.content === "object" ? JSON.stringify(cell.content, null, 2) : cell.content}\n\`\`\`\n`;
        break;
      default:
        content = `\n### 📌 Entry — ${timestamp}\n${cell.content}\n`;
    }

    fs.appendFileSync(filePath, content);

    return {
      success: true,
      notebook: name,
      cell_type: cell.type,
      timestamp,
      path: filePath,
    };
  }

  // ─── Read ───────────────────────────────────────────────

  read(name, options = {}) {
    const filePath = this.resolvePath(name);
    if (!filePath)
      return { success: false, error: `Notebook not found: ${name}` };

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const stats = fs.statSync(filePath);

      if (options.lines) {
        const lines = content.split("\n");
        const start = options.start || 0;
        const end = options.end || start + (options.lines || 50);
        return {
          success: true,
          notebook: name,
          path: filePath,
          size_kb: Math.round((stats.size / 1024) * 100) / 100,
          total_lines: lines.length,
          lines_shown: `${start}-${Math.min(end, lines.length)}`,
          content: lines.slice(start, end).join("\n"),
        };
      }

      return {
        success: true,
        notebook: name,
        path: filePath,
        size_kb: Math.round((stats.size / 1024) * 100) / 100,
        modified: stats.mtime.toISOString(),
        content,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── List ───────────────────────────────────────────────

  list() {
    try {
      const files = fs
        .readdirSync(NOTEBOOKS_DIR)
        .filter((f) => f.endsWith(".md"));
      const notebooks = files.map((f) => {
        const filePath = path.join(NOTEBOOKS_DIR, f);
        const stats = fs.statSync(filePath);
        const firstLine =
          fs.readFileSync(filePath, "utf-8").split("\n")[0] || "";
        return {
          name: f.replace(".md", ""),
          path: filePath,
          size_kb: Math.round((stats.size / 1024) * 100) / 100,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          title: firstLine.replace("# 📓 ", "").replace("# ", ""),
        };
      });

      return {
        success: true,
        count: notebooks.length,
        dir: NOTEBOOKS_DIR,
        notebooks: notebooks.sort(
          (a, b) => new Date(b.modified) - new Date(a.modified),
        ),
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Search ─────────────────────────────────────────────

  search(query) {
    const list = this.list();
    if (!list.success) return list;

    const results = [];
    for (const nb of list.notebooks) {
      const content = fs.readFileSync(nb.path, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query.toLowerCase())) {
          results.push({
            notebook: nb.name,
            line: i + 1,
            content: lines[i].trim().substring(0, 120),
            context: lines
              .slice(Math.max(0, i - 1), Math.min(lines.length, i + 2))
              .join("\n"),
          });
          if (results.length >= 20) break;
        }
      }
      if (results.length >= 20) break;
    }

    return { success: true, query, matches: results.length, results };
  }

  // ─── Delete ─────────────────────────────────────────────

  delete(name) {
    const filePath = this.resolvePath(name);
    if (!filePath)
      return { success: false, error: `Notebook not found: ${name}` };

    try {
      fs.unlinkSync(filePath);
      return { success: true, notebook: name, deleted: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Helpers ────────────────────────────────────────────

  resolvePath(name) {
    const safeName = name.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, "_");
    const filePath = path.join(NOTEBOOKS_DIR, `${safeName}.md`);
    return fs.existsSync(filePath) ? filePath : null;
  }

  // ─── Session Template ───────────────────────────────────

  createSession(name, metadata = {}) {
    const result = this.create(name, { type: "session", ...metadata });
    if (!result.success) return result;

    this.appendCell(name, {
      type: "markdown",
      content: `## 🟣 Session Started\n- **Phase**: ${metadata.phase || "N/A"}\n- **Score**: ${metadata.score || "N/A"}\n- **Objective**: ${metadata.objective || "N/A"}`,
    });

    return result;
  }
}

// ─── CLI ────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args.find((a) => a.startsWith("--cmd="))?.split("=")[1] || "list";
  const name =
    args.find((a) => a.startsWith("--notebook="))?.split("=")[1] ||
    args.find((a) => a.startsWith("--name="))?.split("=")[1];

  const nb = new NotebookEdit();

  switch (cmd) {
    case "list":
      console.log(JSON.stringify(nb.list(), null, 2));
      break;

    case "create": {
      if (!name) {
        console.log(JSON.stringify({ error: "--notebook=name required" }));
        process.exit(1);
      }
      const type = args.find((a) => a.startsWith("--type="))?.split("=")[1];
      console.log(JSON.stringify(nb.create(name, { type }), null, 2));
      break;
    }

    case "session": {
      if (!name) {
        console.log(JSON.stringify({ error: "--notebook=name required" }));
        process.exit(1);
      }
      const phase = args.find((a) => a.startsWith("--phase="))?.split("=")[1];
      const score = args.find((a) => a.startsWith("--score="))?.split("=")[1];
      console.log(
        JSON.stringify(nb.createSession(name, { phase, score }), null, 2),
      );
      break;
    }

    case "append": {
      if (!name) {
        console.log(JSON.stringify({ error: "--notebook=name required" }));
        process.exit(1);
      }
      const type =
        args.find((a) => a.startsWith("--type="))?.split("=")[1] || "markdown";
      const content =
        args.find((a) => a.startsWith("--content="))?.split("=")[1] ||
        "Empty cell";
      console.log(
        JSON.stringify(nb.appendCell(name, { type, content }), null, 2),
      );
      break;
    }

    case "read": {
      if (!name) {
        console.log(JSON.stringify({ error: "--notebook=name required" }));
        process.exit(1);
      }
      const lines = parseInt(
        args.find((a) => a.startsWith("--lines="))?.split("=")[1] || "0",
      );
      const start = parseInt(
        args.find((a) => a.startsWith("--start="))?.split("=")[1] || "0",
      );
      console.log(
        JSON.stringify(nb.read(name, lines ? { lines, start } : {}), null, 2),
      );
      break;
    }

    case "search": {
      const query = args.find((a) => a.startsWith("--query="))?.split("=")[1];
      if (!query) {
        console.log(JSON.stringify({ error: "--query=text required" }));
        process.exit(1);
      }
      console.log(JSON.stringify(nb.search(query), null, 2));
      break;
    }

    case "delete": {
      if (!name) {
        console.log(JSON.stringify({ error: "--notebook=name required" }));
        process.exit(1);
      }
      console.log(JSON.stringify(nb.delete(name), null, 2));
      break;
    }

    case "demo": {
      // Full demo
      console.log("=== CREATE ===");
      console.log(
        JSON.stringify(
          nb.createSession("phase2-session", {
            phase: "2",
            score: 85,
            objective: "85→92",
          }),
          null,
          2,
        ),
      );

      console.log("\n=== APPEND CELLS ===");
      console.log(
        JSON.stringify(
          nb.appendCell("phase2-session", {
            type: "code",
            language: "javascript",
            content: 'console.log("Hello Aether!")',
          }),
          null,
          2,
        ),
      );
      console.log(
        JSON.stringify(
          nb.appendCell("phase2-session", {
            type: "decision",
            decision: "Use StateMachine",
            reason: "Sovereign state tracking",
            alternatives: "Manual tracking",
          }),
          null,
          2,
        ),
      );
      console.log(
        JSON.stringify(
          nb.appendCell("phase2-session", {
            type: "telepathy",
            content: { action: "Phase 2 started", score: 85 },
          }),
          null,
          2,
        ),
      );

      console.log("\n=== LIST ===");
      console.log(JSON.stringify(nb.list(), null, 2));

      console.log("\n=== READ (first 20 lines) ===");
      console.log(
        JSON.stringify(nb.read("phase2-session", { lines: 20 }), null, 2),
      );
      break;
    }

    default:
      console.log(
        JSON.stringify({
          error: `Unknown command: ${cmd}`,
          usage:
            "node notebook_edit.js --cmd=list|create|session|append|read|search|delete|demo",
        }),
      );
  }
}

module.exports = { NotebookEdit };
