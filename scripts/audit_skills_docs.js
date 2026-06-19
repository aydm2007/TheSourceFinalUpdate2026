#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const skillRoot = path.join(root, '.agents', 'skills');
const docsRoot = path.join(root, 'docs');

const requiredFrontmatter = ['name', 'description', 'version'];
const mojibakeMarkers = ['Ù', 'Ø', 'â', 'ð', '�'];

function exists(filePath) {
  return fs.existsSync(filePath);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function parseFrontmatter(content) {
  content = content.replace(/^\uFEFF/, '');
  if (!content.startsWith('---')) return { fields: {}, duplicateKeys: [], hasFrontmatter: false };

  const end = content.indexOf('\n---', 3);
  if (end === -1) return { fields: {}, duplicateKeys: [], hasFrontmatter: false };

  const block = content.slice(3, end).split(/\r?\n/);
  const fields = {};
  const seen = new Set();
  const duplicateKeys = [];

  for (const line of block) {
    const match = /^([A-Za-z0-9_-]+):/.exec(line.trim());
    if (!match) continue;

    const key = match[1];
    if (seen.has(key)) duplicateKeys.push(key);
    seen.add(key);
    fields[key] = true;
  }

  return { fields, duplicateKeys, hasFrontmatter: true };
}

function hasMojibake(content) {
  return mojibakeMarkers.some(marker => content.includes(marker));
}

function scoreSkill(filePath, rootSkill = false) {
  const rel = path.relative(root, filePath);
  const result = {
    path: rel,
    score: 100,
    findings: [],
  };

  if (!exists(filePath)) {
    result.score = 0;
    result.findings.push('missing skill file');
    return result;
  }

  const content = read(filePath);
  const fm = parseFrontmatter(content);

  if (!fm.hasFrontmatter) {
    result.score -= 20;
    result.findings.push('missing or malformed frontmatter');
  }

  for (const field of requiredFrontmatter) {
    if (!fm.fields[field]) {
      result.score -= 8;
      result.findings.push(`missing frontmatter field: ${field}`);
    }
  }

  if (!rootSkill && !fm.fields['allowed-tools']) {
    result.score -= 6;
    result.findings.push('missing allowed-tools declaration');
  }

  if (fm.duplicateKeys.length > 0) {
    result.score -= 10;
    result.findings.push(`duplicate frontmatter keys: ${[...new Set(fm.duplicateKeys)].join(', ')}`);
  }

  if (hasMojibake(content)) {
    result.score -= 12;
    result.findings.push('probable mojibake or broken UTF-8 rendering');
  }

  if (!/<execution_pattern>|operating protocol|instructions|protocol|بروتوكول/i.test(content)) {
    result.score -= 6;
    result.findings.push('missing explicit execution protocol');
  }

  result.score = Math.max(0, result.score);
  return result;
}

function scanSkills() {
  const skills = [];
  if (!exists(skillRoot)) return skills;

  for (const entry of fs.readdirSync(skillRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillRoot, entry.name, 'SKILL.md');
    if (exists(skillFile)) skills.push(scoreSkill(skillFile));
  }

  const master = path.join(skillRoot, 'nexus-core', 'master.md');
  if (exists(master)) skills.push(scoreSkill(master, true));
  return skills.sort((a, b) => a.path.localeCompare(b.path));
}

function scanDocs() {
  const requiredDocs = [
    'ARCHITECTURE.md',
    'SOVEREIGN_GUIDE.md',
    'SKILL_AND_DOCUMENTATION_GOVERNANCE.md',
  ];

  const docs = requiredDocs.map(name => {
    const filePath = path.join(docsRoot, name);
    const result = {
      path: path.relative(root, filePath),
      exists: exists(filePath),
      score: exists(filePath) ? 100 : 0,
      findings: [],
    };

    if (!result.exists) {
      result.findings.push('missing required documentation file');
      return result;
    }

    const content = read(filePath);
    if (hasMojibake(content)) {
      result.score -= 20;
      result.findings.push('probable mojibake or broken UTF-8 rendering');
    }
    if (!/```|mermaid|graph|flowchart/i.test(content)) {
      result.score -= 8;
      result.findings.push('missing executable examples or diagrams');
    }
    if (!/score|maturity|تقييم|نضج/i.test(content)) {
      result.score -= 8;
      result.findings.push('missing maturity or score criteria');
    }

    result.score = Math.max(0, result.score);
    return result;
  });

  return docs;
}

function average(items) {
  if (!items.length) return 0;
  return Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
}

function main() {
  const skills = scanSkills();
  const docs = scanDocs();

  const summary = {
    generatedAt: new Date().toISOString(),
    skillCount: skills.length,
    docsCount: docs.length,
    skillScore: average(skills),
    docsScore: average(docs),
    combinedScore: Math.round((average(skills) * 0.65) + (average(docs) * 0.35)),
    skills,
    docs,
  };

  if (process.argv.includes('--json')) {
    console.error(JSON.stringify(summary, null, 2));
    return;
  }

  console.error(`Skill score: ${summary.skillScore}/100`);
  console.error(`Documentation score: ${summary.docsScore}/100`);
  console.error(`Combined documentation maturity: ${summary.combinedScore}/100`);
  console.error('');

  const failingSkills = skills.filter(skill => skill.findings.length > 0);
  if (failingSkills.length) {
    console.error('Skill findings:');
    for (const skill of failingSkills) {
      console.error(`- ${skill.path}: ${skill.score}/100 - ${skill.findings.join('; ')}`);
    }
  }

  const failingDocs = docs.filter(doc => doc.findings.length > 0);
  if (failingDocs.length) {
    console.error('');
    console.error('Documentation findings:');
    for (const doc of failingDocs) {
      console.error(`- ${doc.path}: ${doc.score}/100 - ${doc.findings.join('; ')}`);
    }
  }
}

main();
