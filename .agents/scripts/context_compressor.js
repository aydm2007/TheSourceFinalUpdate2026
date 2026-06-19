/**
 * 🟣 ContextCompressor — Sovereign Context Compression for Aether Engine V11.0
 * Part of: Phase 2 — 85 → 92
 *
 * Usage: node context_compressor.js --input="text" [--method=summary|diff|telepathy]
 * Bridge: TELEPATHY: compressed context → bridge.json
 *
 * Compresses large contexts for efficient bridge transmission (0-Token mode).
 */

const fs = require("fs");
const path = require("path");

class ContextCompressor {
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 2000;
    this.method = options.method || "summary";
  }

  // ─── Main Compress ──────────────────────────────────────

  compress(input, options = {}) {
    const method = options.method || this.method;
    const startTime = Date.now();

    switch (method) {
      case "summary":
        return this.summaryCompress(input, options);
      case "diff":
        return this.diffCompress(input, options);
      case "telepathy":
        return this.telepathyCompress(input, options);
      case "auto":
        return this.autoCompress(input, options);
      default:
        return {
          error: `Unknown method: ${method}`,
          duration_ms: Date.now() - startTime,
        };
    }
  }

  // ─── Summary Compression ────────────────────────────────

  summaryCompress(input, options = {}) {
    const text = typeof input === "string" ? input : JSON.stringify(input);
    const originalChars = text.length;
    const originalTokens = this.estimateTokens(text);

    if (originalTokens <= this.maxTokens) {
      return {
        method: "summary",
        compressed: text,
        original_tokens: originalTokens,
        compressed_tokens: originalTokens,
        ratio: 1.0,
        strategy: "passthrough",
      };
    }

    // Extract key patterns
    const lines = text.split("\n");
    const keyLines = [];
    const patterns = {
      imports: [],
      errors: [],
      decisions: [],
      paths: [],
      telepathy: [],
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (
        trimmed.startsWith("import ") ||
        trimmed.startsWith("const ") ||
        trimmed.startsWith("require(")
      ) {
        patterns.imports.push(trimmed);
      } else if (
        trimmed.includes("error") ||
        trimmed.includes("Error") ||
        trimmed.includes("fail")
      ) {
        patterns.errors.push(trimmed);
      } else if (
        trimmed.includes("TELEPATHY:") ||
        trimmed.includes("DECISION:") ||
        trimmed.includes("PATTERN:")
      ) {
        patterns.decisions.push(trimmed);
      } else if (trimmed.match(/[\/\\][\w.-]+\.\w+/)) {
        patterns.paths.push(trimmed);
      } else if (trimmed.length > 20) {
        keyLines.push(trimmed);
      }
    }

    // Build compressed output
    let compressed = "";
    compressed += `[SUMMARY: ${lines.length} lines → compressed]\n`;

    if (patterns.telepathy.length > 0) {
      compressed += `\n## TELEPATHY Signals (${patterns.telepathy.length})\n`;
      compressed += patterns.telepathy.slice(0, 5).join("\n") + "\n";
    }

    if (patterns.errors.length > 0) {
      compressed += `\n## Errors (${patterns.errors.length})\n`;
      compressed += patterns.errors.slice(0, 3).join("\n") + "\n";
    }

    if (patterns.decisions.length > 0) {
      compressed += `\n## Decisions (${patterns.decisions.length})\n`;
      compressed += patterns.decisions.slice(0, 5).join("\n") + "\n";
    }

    if (patterns.paths.length > 0) {
      compressed += `\n## Files (${patterns.paths.length})\n`;
      compressed += patterns.paths.slice(0, 10).join("\n") + "\n";
    }

    if (keyLines.length > 0 && compressed.length < 500) {
      compressed += `\n## Key Content\n`;
      compressed += keyLines.slice(0, 10).join("\n") + "\n";
    }

    const compressedTokens = this.estimateTokens(compressed);

    return {
      method: "summary",
      compressed,
      original_tokens: originalTokens,
      compressed_tokens: compressedTokens,
      ratio: Math.round((compressedTokens / originalTokens) * 100) / 100,
      strategy: "pattern_extraction",
      patterns_found: {
        imports: patterns.imports.length,
        errors: patterns.errors.length,
        decisions: patterns.decisions.length,
        paths: patterns.paths.length,
      },
    };
  }

  // ─── Diff Compression (only changes) ────────────────────

  diffCompress(input, options = {}) {
    const text = typeof input === "string" ? input : JSON.stringify(input);
    const original = options.original || "";

    if (!original) {
      return this.summaryCompress(input, options);
    }

    const originalLines = original.split("\n");
    const newLines = text.split("\n");
    const changes = [];

    // Simple line-by-line diff
    const maxLen = Math.max(originalLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= originalLines.length) {
        changes.push(`+ ${newLines[i]}`);
      } else if (i >= newLines.length) {
        changes.push(`- ${originalLines[i]}`);
      } else if (originalLines[i] !== newLines[i]) {
        changes.push(
          `~ ${originalLines[i].substring(0, 40)} → ${newLines[i].substring(0, 40)}`,
        );
      }
    }

    const compressed = changes.join("\n");
    const originalTokens = this.estimateTokens(text);

    return {
      method: "diff",
      compressed,
      original_tokens: originalTokens,
      compressed_tokens: this.estimateTokens(compressed),
      ratio:
        Math.round((this.estimateTokens(compressed) / originalTokens) * 100) /
        100,
      changes_count: changes.length,
      strategy: "diff_only",
    };
  }

  // ─── Telepathy Compression (ultra-minimal) ──────────────

  telepathyCompress(input, options = {}) {
    const text = typeof input === "string" ? input : JSON.stringify(input);

    // Extract only the essential: what, where, why
    const lines = text.split("\n");
    const telepathy = {
      action: "",
      files: [],
      reason: "",
      result: "",
    };

    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith("TELEPATHY:")) {
        telepathy.action = t.replace("TELEPATHY:", "").trim();
      } else if (t.match(/[\/\\][\w.-]+\.\w+/)) {
        const match = t.match(/([\/\\][\w.-]+\.\w+)/);
        if (match && !telepathy.files.includes(match[1])) {
          telepathy.files.push(match[1]);
        }
      } else if (t.includes("✅") || t.includes("❌") || t.includes("⚠️")) {
        telepathy.result = t;
      }
    }

    if (!telepathy.action && lines.length > 0) {
      telepathy.action = lines[0].substring(0, 100);
    }

    const compressed = JSON.stringify(telepathy);
    const originalTokens = this.estimateTokens(text);

    return {
      method: "telepathy",
      compressed,
      original_tokens: originalTokens,
      compressed_tokens: this.estimateTokens(compressed),
      ratio:
        Math.round((this.estimateTokens(compressed) / originalTokens) * 100) /
        100,
      strategy: "telepathy_pulse",
      telepathy,
    };
  }

  // ─── Auto (best method) ─────────────────────────────────

  autoCompress(input, options = {}) {
    const text = typeof input === "string" ? input : JSON.stringify(input);
    const tokens = this.estimateTokens(text);

    if (tokens < 500) {
      return this.telepathyCompress(input, options);
    } else if (tokens < 2000) {
      return this.summaryCompress(input, options);
    } else {
      return this.diffCompress(input, options);
    }
  }

  // ─── Token Estimation ───────────────────────────────────

  estimateTokens(text) {
    if (!text) return 0;
    // Conservative: ~2.5 chars per token for mixed content
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const englishChars = text.length - arabicChars;
    const arabicTokens = Math.ceil(arabicChars / 1.5);
    const englishTokens = Math.ceil(englishChars / 2.5);
    return arabicTokens + englishTokens;
  }

  // ─── File Compression ───────────────────────────────────

  compressFile(filePath, options = {}) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const result = this.compress(content, options);
      result.file = filePath;
      result.original_size_kb = Math.round((content.length / 1024) * 100) / 100;
      return result;
    } catch (err) {
      return { error: err.message, file: filePath };
    }
  }

  // ─── Bridge Pulse Format ────────────────────────────────

  toBridgePulse(input, options = {}) {
    const compressed = this.telepathyCompress(input, options);
    const telepathy = JSON.parse(compressed.compressed);

    return {
      pulse: {
        from: "Gemini-Flash-3",
        timestamp: new Date().toISOString(),
        action: telepathy.action,
        files: telepathy.files,
        result: telepathy.result,
      },
      compression: {
        method: "telepathy",
        ratio: compressed.ratio,
        original_tokens: compressed.original_tokens,
      },
    };
  }
}

// ─── CLI ────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args.find((a) => a.startsWith("--cmd="))?.split("=")[1] || "test";
  const method =
    args.find((a) => a.startsWith("--method="))?.split("=")[1] || "auto";

  const compressor = new ContextCompressor({ method });

  switch (cmd) {
    case "test": {
      const testInput = `
import React from 'react';
import { useState } from 'react';

// This is a large component with lots of code
function MyComponent() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // Error handling
  if (error) {
    console.error('Failed to load:', error);
    return <div>Error: {error.message}</div>;
  }
  
  TELEPATHY: This component needs optimization
  DECISION: Use React.memo for performance
  
  // File paths
  const configPath = '/src/config/settings.js';
  const apiPath = '/src/services/api.js';
  
  return <div>Hello World</div>;
}

export default MyComponent;
`.repeat(5); // Make it larger

      console.log("=== SUMMARY ===");
      console.log(
        JSON.stringify(
          compressor.compress(testInput, { method: "summary" }),
          null,
          2,
        ),
      );

      console.log("\n=== TELEPATHY ===");
      console.log(
        JSON.stringify(
          compressor.compress(testInput, { method: "telepathy" }),
          null,
          2,
        ),
      );

      console.log("\n=== BRIDGE PULSE ===");
      console.log(JSON.stringify(compressor.toBridgePulse(testInput), null, 2));
      break;
    }

    case "file": {
      const filePath = args.find((a) => a.startsWith("--path="))?.split("=")[1];
      if (!filePath) {
        console.log(JSON.stringify({ error: "--path=file required" }));
        process.exit(1);
      }
      const result = compressor.compressFile(filePath, { method });
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "compare": {
      const testInput = "This is a test message. ".repeat(100);
      const methods = ["summary", "diff", "telepathy", "auto"];
      const results = methods.map((m) => {
        const r = compressor.compress(testInput, { method: m });
        return { method: m, ratio: r.ratio, tokens: r.compressed_tokens };
      });
      console.log(JSON.stringify(results, null, 2));
      break;
    }

    default:
      console.log(
        JSON.stringify({
          error: `Unknown command: ${cmd}`,
          usage:
            "node context_compressor.js --cmd=test|file|compare [--method=summary|diff|telepathy|auto]",
        }),
      );
  }
}

module.exports = { ContextCompressor };
