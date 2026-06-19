/**
 * 🟣 ToolSearch — Sovereign Tool Discovery & Index
 * Part of: Aether Engine V11.0 — Zero-Token Orchestration
 * 
 * Usage: node tool_search.js [query] [--format=json|markdown]
 * Bridge: TELEPATHY: toolsearch "query" → bridge.json
 * 
 * Scans the Instrumentarium and returns matching tools.
 */

const fs = require('fs');
const path = require('path');

// The Sovereign Instrumentarium — canonical tool registry
const INSTRUMENTARIUM = {
  "FileRead": {
    category: "👁️ The Vision",
    description: "قراءة محتوى ملف كامل",
    usage: "FileRead(file_path: 'path/to/file')",
    maturity: 100,
    tags: ["read", "file", "scan", "inspect"]
  },
  "FileReadLines": {
    category: "👁️ The Vision",
    description: "قراءة نطاق محدد من الأسطر بدقة",
    usage: "FileReadLines(file_path, start_line, end_line)",
    maturity: 100,
    tags: ["read", "file", "lines", "precise"]
  },
  "FileWrite": {
    category: "✋ The Weaver",
    description: "إنشاء أو استبدال ملف كامل",
    usage: "FileWrite(file_path, content)",
    maturity: 100,
    tags: ["write", "file", "create", "overwrite"]
  },
  "SurgicalDiff": {
    category: "✋ The Weaver",
    description: "تعديل جراحي عالي الدقة — يجب أن يكون block البحث فريداً",
    usage: "SurgicalDiff(file_path, search_block, replace_block)",
    maturity: 100,
    tags: ["edit", "diff", "surgical", "precise"]
  },
  "Bash": {
    category: "🦿 The Echo",
    description: "تنفيذ أوامر النظام مباشرة",
    usage: "Bash(command, description?, timeout?)",
    maturity: 95,
    tags: ["shell", "execute", "system", "test"]
  },
  "Grep": {
    category: "👁️ The Vision",
    description: "بحث نمطي في الملفات",
    usage: "Grep(pattern, path?, glob?, output_mode?)",
    maturity: 100,
    tags: ["search", "pattern", "regex", "find"]
  },
  "Glob": {
    category: "👁️ The Vision",
    description: "اكتشاف الملفات عبر أنماط المسارات",
    usage: "Glob(pattern: '**/*.md')",
    maturity: 95,
    tags: ["search", "pattern", "files", "discover"]
  },
  "TodoWrite": {
    category: "🧪 The Fusion",
    description: "تسجيل تقدم المهام وحالتها",
    usage: "TodoWrite(task_id, status, description?)",
    maturity: 90,
    tags: ["task", "track", "progress", "plan"]
  },
  "SemanticReference": {
    category: "🧪 The Fusion",
    description: "تتبع استخدامات الرموز وتعريفاتها",
    usage: "SemanticReference(symbol_name)",
    maturity: 100,
    tags: ["symbol", "trace", "reference", "definition"]
  },
  "VisualAuditReport": {
    category: "📊 The Sovereign",
    description: "توليد لوحة تقارير HTML فاخرة",
    usage: "VisualAuditReport(report_data)",
    maturity: 100,
    tags: ["report", "html", "dashboard", "audit"]
  },
  "Sleep": {
    category: "🦿 The Echo",
    description: "انتظار مؤقت للعمليات غير المتزامنة",
    usage: "node .agents/scripts/sleep_tool.js 1000",
    maturity: 100,
    tags: ["wait", "delay", "async", "pause"]
  },
  "EnterPlanMode": {
    category: "🧠 The Head",
    description: "الدخول في نمط التخطيط الاستراتيجي",
    usage: "node .agents/scripts/enter_plan_mode.js 'خطة'",
    maturity: 100,
    tags: ["plan", "strategy", "mode", "think"]
  },
  "ExitPlanMode": {
    category: "🧠 The Head",
    description: "الخروج من نمط التخطيط والعودة للتنفيذ",
    usage: "node .agents/scripts/exit_plan_mode.js",
    maturity: 100,
    tags: ["plan", "strategy", "mode", "execute"]
  },
  "WebFetch": {
    category: "🌐 The Network",
    description: "جلب محتوى من URL خارجي",
    usage: "WebFetch(url, options?)",
    maturity: 85,
    tags: ["web", "fetch", "http", "url"]
  },
  "WebSearch": {
    category: "🌐 The Network",
    description: "بحث في الويب الخارجي",
    usage: "WebSearch(query, options?)",
    maturity: 85,
    tags: ["web", "search", "internet", "query"]
  },
  "TokenEstimation": {
    category: "📊 The Sovereign",
    description: "تقدير عدد التوكنات للنصوص",
    usage: "node .agents/scripts/token_estimator.js 'text'",
    maturity: 85,
    tags: ["token", "count", "estimate", "cost"]
  }
};

class ToolSearch {
  constructor() {
    this.tools = INSTRUMENTARIUM;
  }

  search(query) {
    if (!query || query.trim() === '') {
      return this.listAll();
    }

    const q = query.toLowerCase();
    const results = {};

    for (const [name, tool] of Object.entries(this.tools)) {
      const nameMatch = name.toLowerCase().includes(q);
      const descMatch = tool.description.includes(q);
      const tagMatch = tool.tags.some(tag => tag.includes(q));
      const catMatch = tool.category.includes(q);

      if (nameMatch || descMatch || tagMatch || catMatch) {
        results[name] = {
          ...tool,
          relevance: this.score(name, tool, q)
        };
      }
    }

    // Sort by relevance
    const sorted = Object.entries(results)
      .sort((a, b) => b[1].relevance - a[1].relevance)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    return sorted;
  }

  score(name, tool, query) {
    let score = 0;
    if (name.toLowerCase().includes(query)) score += 10;
    if (tool.description.includes(query)) score += 5;
    if (tool.tags.some(t => t.includes(query))) score += 3;
    if (tool.category.includes(query)) score += 2;
    return score;
  }

  listAll() {
    const byCategory = {};
    for (const [name, tool] of Object.entries(this.tools)) {
      if (!byCategory[tool.category]) byCategory[tool.category] = {};
      byCategory[tool.category][name] = tool;
    }
    return byCategory;
  }

  stats() {
    const total = Object.keys(this.tools).length;
    const mature = Object.values(this.tools).filter(t => t.maturity >= 95).length;
    const active = Object.values(this.tools).filter(t => t.maturity >= 80).length;
    return {
      total_tools: total,
      fully_mature: mature,
      production_ready: active,
      maturity_pct: Math.round((active / total) * 100)
    };
  }

  formatMarkdown(results) {
    let md = '# 🔍 Sovereign Tool Search Results\n\n';
    
    if (results.total_tools) {
      // Stats view
      md += `| Metric | Value |\n|--------|-------|\n`;
      md += `| Total Tools | ${results.total_tools} |\n`;
      md += `| Fully Mature | ${results.fully_mature} |\n`;
      md += `| Production Ready | ${results.production_ready} |\n`;
      md += `| Maturity | ${results.maturity_pct}% |\n`;
    } else {
      // Search results
      md += '| Tool | Category | Maturity | Description |\n';
      md += '|------|----------|----------|-------------|\n';
      for (const [name, tool] of Object.entries(results)) {
        md += `| **${name}** | ${tool.category} | ${tool.maturity}% | ${tool.description} |\n`;
      }
    }

    return md;
  }
}

// CLI
const toolSearch = new ToolSearch();
const args = process.argv.slice(2);
const query = args.find(a => !a.startsWith('--')) || '';
const format = args.includes('--markdown') ? 'markdown' : 'json';

let result;
if (query === 'stats' || query === '--stats') {
  result = toolSearch.stats();
} else {
  result = toolSearch.search(query);
}

if (format === 'markdown') {
  console.log(toolSearch.formatMarkdown(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { ToolSearch, INSTRUMENTARIUM };
