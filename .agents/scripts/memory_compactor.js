/**
 * 🧠 MemoryCompactor — Automated Sovereign Memory Rotation & Archiving
 * Part of: Phase 3 — AETHER-ZENITH V15.0-Apex
 *
 * Usage: node memory_compactor.js [--path=...] [--threshold=500] [--force]
 */

const fs = require("fs");
const path = require("path");

class MemoryCompactor {
  constructor(options = {}) {
    this.memoryDir = options.memoryDir || path.join(__dirname, "../memory");
    this.threshold = options.threshold || 500;
  }

  compactFile(fileName, force = false) {
    const filePath = path.join(this.memoryDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`[COMPACTOR] File not found: ${filePath}`);
      return { status: "skipped", reason: "not_found" };
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    console.log(
      `[COMPACTOR] Analyzing ${fileName}: ${lines.length} lines (Threshold: ${this.threshold})`,
    );

    if (lines.length <= this.threshold && !force) {
      console.log(
        `[COMPACTOR] ${fileName} is within limits. No compaction needed.`,
      );
      return {
        status: "skipped",
        reason: "below_threshold",
        lines: lines.length,
      };
    }

    console.log(`[COMPACTOR] Compacting ${fileName}...`);

    // Parse entries. In SKILL.md/decisions.md format:
    // Entries are separated by ## [Date] or ## [2026-
    // We want to archive older entries and keep the most recent ones.
    const headerLines = [];
    const entries = [];
    let currentEntry = null;
    let readingHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith("## ")) {
        readingHeader = false;
        if (currentEntry) {
          entries.push(currentEntry);
        }
        currentEntry = { header: line, content: [] };
      } else if (readingHeader) {
        headerLines.push(line);
      } else if (currentEntry) {
        currentEntry.content.push(line);
      }
    }

    if (currentEntry) {
      entries.push(currentEntry);
    }

    if (entries.length === 0) {
      console.log(
        `[COMPACTOR] No structured entries found in ${fileName}. Skipped.`,
      );
      return { status: "skipped", reason: "no_entries" };
    }

    console.log(`[COMPACTOR] Found ${entries.length} memory entries.`);

    // Split entries: keep latest 5 entries, archive the rest.
    const keepCount = Math.min(5, entries.length);
    const archiveCount = entries.length - keepCount;

    if (archiveCount <= 0 && !force) {
      console.log(`[COMPACTOR] Not enough entries to split. Skipped.`);
      return { status: "skipped", reason: "too_few_entries" };
    }

    const archiveEntries = entries.slice(0, archiveCount);
    const keepEntries = entries.slice(archiveCount);

    // 1. Write to archive
    const archiveName = fileName.replace(".md", "_archive.md");
    const archivePath = path.join(this.memoryDir, archiveName);
    let archiveContent = "";

    if (fs.existsSync(archivePath)) {
      archiveContent = fs.readFileSync(archivePath, "utf-8");
    } else {
      archiveContent = `# 📋 أرشيف الذاكرة التاريخي — ${fileName.replace(".md", "")}\n\n`;
    }

    const newArchiveContent =
      archiveEntries
        .map((e) => `${e.header}\n${e.content.join("\n")}`)
        .join("\n") + "\n";
    fs.writeFileSync(
      archivePath,
      archiveContent + "\n" + newArchiveContent,
      "utf-8",
    );
    console.log(
      `[COMPACTOR] Archived ${archiveCount} entries to ${archiveName}`,
    );

    // 2. Write kept entries back to main file
    const mainHeader = headerLines.join("\n").trim();
    const keptContent = keepEntries
      .map((e) => `${e.header}\n${e.content.join("\n")}`)
      .join("\n");

    // Ensure the <!-- APPEND --> tag is preserved or added
    let finalMainContent = mainHeader + "\n\n";
    if (
      !finalMainContent.includes("<!-- APPEND -->") &&
      !keptContent.includes("<!-- APPEND -->")
    ) {
      finalMainContent += "<!-- APPEND -->\n\n";
    }
    finalMainContent += keptContent;

    fs.writeFileSync(filePath, finalMainContent.trim() + "\n", "utf-8");
    const newLinesCount = fs.readFileSync(filePath, "utf-8").split("\n").length;
    console.log(
      `[COMPACTOR] Main file ${fileName} updated. New line count: ${newLinesCount}`,
    );

    // Log the transaction to shadow_ledger.jsonl
    this.logTransaction(fileName, archiveCount, keepCount);

    return {
      status: "success",
      archived: archiveCount,
      retained: keepCount,
      new_lines: newLinesCount,
    };
  }

  logTransaction(fileName, archived, retained) {
    const logPath = path.join(this.memoryDir, "shadow_ledger.jsonl");
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: "MemoryCompactor",
      action: "COMPACT_MEMORY_FILE",
      file: fileName,
      details: { archived, retained },
      security_status: "CLEAN",
    };

    fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n", "utf-8");
    console.log(`[COMPACTOR] Transaction registered in shadow_ledger.jsonl`);
  }

  compactAll(force = false) {
    const files = ["decisions.md", "patterns.md", "bugs.md"];
    const results = {};
    for (const file of files) {
      results[file] = this.compactFile(file, force);
    }
    return results;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const thresholdArg = args
    .find((a) => a.startsWith("--threshold="))
    ?.split("=")[1];
  const threshold = thresholdArg ? parseInt(thresholdArg, 10) : 500;

  const compactor = new MemoryCompactor({ threshold });
  const results = compactor.compactAll(force);
  console.log(
    "[COMPACTOR] Compaction process completed:",
    JSON.stringify(results, null, 2),
  );
}

module.exports = { MemoryCompactor };
