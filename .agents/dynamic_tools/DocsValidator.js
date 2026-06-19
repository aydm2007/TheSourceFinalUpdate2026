// Self-Synthesized Tool: DocsValidator
// Validates markdown documentation files in a project. Checks for presence of a top‑level heading, non‑empty content, and optional usage section. Returns a JSON report of passed and failed files.
module.exports = const fs = require('fs').promises;
const path = require('path');

async function walk(dir) {
  let results = [];
  const list = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of list) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

async function validateDocs(projectPath = '.') {
  const files = await walk(projectPath);
  const report = { total: files.length, passed: [], warnings: [], errors: [] };
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      report.errors.push({ file, reason: 'Empty file' });
      continue;
    }
    const hasHeading = lines.some(l => l.startsWith('# '));
    if (!hasHeading) {
      report.warnings.push({ file, reason: 'Missing top‑level heading' });
    }
    if (content.length < 50) {
      report.warnings.push({ file, reason: 'Content shorter than 50 characters' });
    }
    // optional usage section check
    const hasUsage = lines.some(l => l.toLowerCase().startsWith('## usage'));
    if (!hasUsage) {
      report.warnings.push({ file, reason: 'Missing ## Usage section' });
    }
    report.passed.push(file);
  }
  return report;
}

module.exports = async (args, context) => {
  const projectPath = args.projectPath || '.';
  const result = await validateDocs(projectPath);
  return { success: true, report: result };
};;