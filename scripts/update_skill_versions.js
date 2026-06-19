const fs = require('fs');
const path = require('path');

const skillsDir = path.resolve(__dirname, '../.agents/skills');
const targetVersion = '45.0-Omega';
const targetEngine = 'AETHER-ZENITH-V45.0-OMEGA_NEXUS';

function getMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getMarkdownFiles(filePath));
    } else if (file.endsWith('.md')) {
      results.push(filePath);
    }
  });
  return results;
}

const mdFiles = getMarkdownFiles(skillsDir);

mdFiles.forEach(filePath => {
  const relPath = path.relative(skillsDir, filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // فحص وتحديث حقل الإصدار في الترويسة YAML
  const versionRegex = /version:\s*["']([^"']+)["']/g;
  const versionMatch = content.match(versionRegex);
  if (versionMatch) {
    const updatedContent = content.replace(versionRegex, `version: "${targetVersion}"`);
    if (updatedContent !== content) {
      content = updatedContent;
      updated = true;
    }
  }

  // فحص وتحديث حقل المحرك في الترويسة YAML
  const engineRegex = /engine-version:\s*["']([^"']+)["']/g;
  const engineMatch = content.match(engineRegex);
  if (engineMatch) {
    const updatedContent = content.replace(engineRegex, `engine-version: "${targetEngine}"`);
    if (updatedContent !== content) {
      content = updatedContent;
      updated = true;
    }
  } else if (content.startsWith('---')) {
    // إذا لم يكن موجوداً وكان الملف يحتوي على ترويسة YAML، نضيفه
    const parts = content.split('---');
    if (parts.length >= 3) {
      parts[1] = parts[1] + `engine-version: "${targetEngine}"\n`;
      content = parts.join('---');
      updated = true;
    }
  }

  // فحص تحديث النصوص الوصفية التي تشير للإصدار القديم V15 أو غيره
  // ملاحظة: نتجنب تعديل السطر 194 في master.md لأنه المرساة المحمية
  if (relPath !== 'nexus-core\\master.md') {
    const descRegex = /AETHER-ZENITH\s+V[0-9.]+(?:-[\w-]+)?/gi;
    const updatedContent = content.replace(descRegex, `AETHER-ZENITH V${targetVersion}`);
    if (updatedContent !== content) {
      content = updatedContent;
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.error(`✅ تم تحديث المزامنة لـ: ${relPath}`);
  } else {
    console.error(`ℹ️ متوافق بالفعل: ${relPath}`);
  }
});
