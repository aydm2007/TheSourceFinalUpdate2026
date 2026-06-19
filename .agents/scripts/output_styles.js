/**
 * 🟣 OutputStyles — Sovereign Output Formatter for Aether Engine V11.0
 * Part of: Phase 2 — 85 → 92
 *
 * Usage: node output_styles.js --format=json|markdown|html|telepathy [--input=...]
 * Provides multiple output styles for different consumption modes.
 */

const fs = require("fs");
const path = require("path");

const STYLES = {
  json: { name: "JSON Raw", ext: ".json", mime: "application/json" },
  markdown: { name: "Markdown Sovereign", ext: ".md", mime: "text/markdown" },
  html: { name: "HTML Premium", ext: ".html", mime: "text/html" },
  telepathy: {
    name: "Telepathy Pulse",
    ext: ".json",
    mime: "application/json",
  },
  table: { name: "ASCII Table", ext: ".txt", mime: "text/plain" },
  yaml: { name: "YAML Config", ext: ".yaml", mime: "text/yaml" },
};

class OutputStyles {
  constructor() {
    this.defaultStyle = "markdown";
  }

  // ─── Format Data ────────────────────────────────────────

  format(data, style = "markdown", options = {}) {
    switch (style) {
      case "json":
        return this.toJSON(data, options);
      case "markdown":
        return this.toMarkdown(data, options);
      case "html":
        return this.toHTML(data, options);
      case "telepathy":
        return this.toTelepathy(data, options);
      case "table":
        return this.toTable(data, options);
      case "yaml":
        return this.toYAML(data, options);
      default:
        return {
          error: `Unknown style: ${style}`,
          available: Object.keys(STYLES),
        };
    }
  }

  // ─── JSON ───────────────────────────────────────────────

  toJSON(data, options = {}) {
    return {
      style: "json",
      content: JSON.stringify(data, null, options.pretty !== false ? 2 : 0),
      content_type: "application/json",
    };
  }

  // ─── Markdown ───────────────────────────────────────────

  toMarkdown(data, options = {}) {
    let md = "";
    const title = options.title || "Sovereign Report";

    md += `# 🟣 ${title}\n`;
    md += `> **Aether Engine V11.0** | **${new Date().toISOString()}**\n\n`;

    if (data.summary) {
      md += `## 📊 Summary\n${data.summary}\n\n`;
    }

    if (data.metrics) {
      md += "## 📈 Metrics\n";
      md += "| Metric | Value |\n|--------|-------|\n";
      for (const [k, v] of Object.entries(data.metrics)) {
        md += `| ${k} | ${v} |\n`;
      }
      md += "\n";
    }

    if (data.tools && Array.isArray(data.tools)) {
      md += "## 🛠️ Tools\n";
      md += "| Tool | Status | Maturity |\n|------|--------|----------|\n";
      for (const tool of data.tools) {
        md += `| ${tool.name || "?"} | ${tool.status || "?"} | ${tool.maturity || "?"}% |\n`;
      }
      md += "\n";
    }

    if (data.files && Array.isArray(data.files)) {
      md += "## 📁 Files\n";
      for (const f of data.files) {
        md += `- \`${f.path || f}\` — ${f.desc || ""}\n`;
      }
      md += "\n";
    }

    if (data.recommendation) {
      md += `## 💡 Recommendation\n> ${data.recommendation}\n\n`;
    }

    if (data.raw_text) {
      md += `\n${data.raw_text}\n`;
    }

    return { style: "markdown", content: md, content_type: "text/markdown" };
  }

  // ─── HTML ────────────────────────────────────────────────

  toHTML(data, options = {}) {
    const title = options.title || "Sovereign Report";
    const score = data.score || data.metrics?.score || 85;

    let html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Aether Engine V11.0</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Cairo', 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%); color: #e0e0e0; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .header { text-align: center; padding: 2rem 0; border-bottom: 2px solid rgba(123, 47, 247, 0.3); margin-bottom: 2rem; }
    .header h1 { font-size: 2.5rem; background: linear-gradient(135deg, #7B2FF7, #00D4AA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .score-circle { width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#00D4AA ${score}%, #1a1a3e ${score}%); display: flex; align-items: center; justify-content: center; margin: 1rem auto; position: relative; }
    .score-inner { width: 90px; height: 90px; border-radius: 50%; background: #0a0a1a; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: #00D4AA; }
    .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(123,47,247,0.2); border-radius: 12px; padding: 1.5rem; margin: 1rem 0; }
    .card h2 { color: #7B2FF7; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.1); }
    th { color: #00D4AA; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; }
    .badge-success { background: rgba(0,212,170,0.2); color: #00D4AA; }
    .badge-warning { background: rgba(255,193,7,0.2); color: #ffc107; }
    .footer { text-align: center; padding: 2rem; color: #666; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <div class="score-circle"><div class="score-inner">${score}</div></div>
      <p>Aether Engine V11.0 — Supra-Zenith</p>
    </div>
`;

    if (data.tools && Array.isArray(data.tools)) {
      html +=
        '<div class="card"><h2>🛠️ الأدوات</h2><table><tr><th>الأداة</th><th>الحالة</th><th>النضج</th></tr>';
      for (const tool of data.tools) {
        const badge =
          tool.status === "production_ready"
            ? "badge-success"
            : "badge-warning";
        html += `<tr><td>${tool.name}</td><td><span class="badge ${badge}">${tool.status}</span></td><td>${tool.maturity || "?"}%</td></tr>`;
      }
      html += "</table></div>";
    }

    if (data.recommendation) {
      html += `<div class="card"><h2>💡 التوصية</h2><p>${data.recommendation}</p></div>`;
    }

    html +=
      '<div class="footer">Aether Engine V11.0 — Supra-Zenith Active</div></div></body></html>';
    return { style: "html", content: html, content_type: "text/html" };
  }

  // ─── Telepathy ───────────────────────────────────────────

  toTelepathy(data, options = {}) {
    const pulse = {
      from: "Gemini-Flash-3",
      timestamp: new Date().toISOString(),
      type: options.type || "status",
      action: data.action || data.summary || "",
      files: data.files || [],
      result: data.result || data.recommendation || "",
      score: data.score || data.metrics?.score || 85,
    };

    return {
      style: "telepathy",
      content: JSON.stringify(pulse),
      content_type: "application/json",
      pulse,
    };
  }

  // ─── ASCII Table ────────────────────────────────────────

  toTable(data, options = {}) {
    if (!data.rows || !data.headers) {
      return {
        style: "table",
        content: JSON.stringify(data),
        content_type: "text/plain",
      };
    }

    const headers = data.headers;
    const rows = data.rows;
    const colWidths = headers.map(
      (h, i) =>
        Math.max(h.length, ...rows.map((r) => String(r[i] || "").length)) + 2,
    );

    const sep = "+" + colWidths.map((w) => "-".repeat(w)).join("+") + "+";
    let table = sep + "\n";
    table +=
      "|" +
      headers.map((h, i) => ` ${h.padEnd(colWidths[i] - 1)}`).join("|") +
      "|\n";
    table += sep + "\n";
    for (const row of rows) {
      table +=
        "|" +
        row
          .map((cell, i) => ` ${String(cell || "").padEnd(colWidths[i] - 1)}`)
          .join("|") +
        "|\n";
    }
    table += sep;

    return { style: "table", content: table, content_type: "text/plain" };
  }

  // ─── YAML ────────────────────────────────────────────────

  toYAML(data, options = {}) {
    const yaml = this._toYAML(data, 0);
    return { style: "yaml", content: yaml, content_type: "text/yaml" };
  }

  _toYAML(obj, indent) {
    const prefix = "  ".repeat(indent);
    if (obj === null || obj === undefined) return "null";
    if (typeof obj === "string") return `"${obj}"`;
    if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";
      return obj
        .map(
          (item) => `${prefix}- ${this._toYAML(item, indent + 1).trimStart()}`,
        )
        .join("\n");
    }
    if (typeof obj === "object") {
      const entries = Object.entries(obj);
      if (entries.length === 0) return "{}";
      return entries
        .map(
          ([k, v]) =>
            `${prefix}${k}: ${this._toYAML(v, indent + 1).trimStart()}`,
        )
        .join("\n");
    }
    return String(obj);
  }

  // ─── List Styles ────────────────────────────────────────

  listStyles() {
    return Object.entries(STYLES).map(([key, style]) => ({
      key,
      name: style.name,
      extension: style.ext,
      mime: style.mime,
    }));
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const format =
    args.find((a) => a.startsWith("--format="))?.split("=")[1] || "markdown";
  const title = args.find((a) => a.startsWith("--title="))?.split("=")[1];

  const os = new OutputStyles();

  if (format === "list") {
    console.log(JSON.stringify(os.listStyles(), null, 2));
    process.exit(0);
  }

  const sampleData = {
    summary: "المرحلة الثانية قيد التنفيذ — 4/7 خدمات مكتملة",
    metrics: { score: 85, target: 92, tools: 17, services: 4, phase: 2 },
    tools: [
      { name: "StateMachine", status: "production_ready", maturity: 95 },
      { name: "PermissionCallbacks", status: "production_ready", maturity: 95 },
      { name: "ContextCompressor", status: "production_ready", maturity: 95 },
      { name: "LazyLoader", status: "production_ready", maturity: 90 },
    ],
    files: [
      {
        path: ".agents/scripts/state_machine.js",
        desc: "Sovereign state tracking",
      },
      {
        path: ".agents/scripts/permission_callbacks.js",
        desc: "Security guard system",
      },
      {
        path: ".agents/scripts/context_compressor.js",
        desc: "Bridge compression",
      },
      {
        path: ".agents/scripts/lazy_loader.js",
        desc: "On-demand module loading",
      },
    ],
    recommendation: "استكمال 3 خدمات متبقية للوصول إلى 92/100",
  };

  const result = os.format(sampleData, format, {
    title: title || "Phase 2 Progress",
  });
  console.log(result.content);
}

module.exports = { OutputStyles, STYLES };
