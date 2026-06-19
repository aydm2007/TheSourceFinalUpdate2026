// Watcher for active_skill drift – aborts if not mcp-developer
const fs = require('fs');
const path = require('path');

// Base directory of the project (workspace root)
const PROJECT_ROOT = process.cwd();

// Primary source: session local skill (authoritative)
const SESSION_SKILL_PATH = path.join(PROJECT_ROOT, '.nexus', 'sessions', 'local_skill.json');
// Legacy fallback (read‑only, for backward compatibility)
const LEGACY_SKILL_PATH = path.join(PROJECT_ROOT, '.agents', 'skills', 'active_skill.json');

function readSkill(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    // Different files may use different keys – normalize
    return json.active_skill || json.activeSkill || json.activeSkillName || json.activeSkill;
  } catch (e) {
    return null; // not found or malformed
  }
}

function getActiveSkill() {
  // Prefer the session file (authoritative)
  const session = readSkill(SESSION_SKILL_PATH);
  if (session) return session;
  // Fallback to legacy file only for read‑only drift detection
  const legacy = readSkill(LEGACY_SKILL_PATH);
  return legacy;
}

function main() {
  const skill = getActiveSkill();
  if (!skill) {
    console.error('❌ Active skill file missing (checked both session and legacy locations).');
    process.exit(1);
  }
  if (skill !== 'mcp-developer') {
    console.error(`⚠️ Edit skill drift detected – active skill is "${skill}" (expected "mcp-developer").`);
    process.exit(1);
  }
  console.log('✅ Active skill is correct (mcp-developer).');
}

// Initial check
main();

// Watch for future changes on the legacy file (session changes are handled by the kernel)
if (fs.existsSync(LEGACY_SKILL_PATH)) {
  fs.watch(LEGACY_SKILL_PATH, (eventType) => {
    if (eventType === 'change') {
      console.log('🛎️ Legacy active_skill.json changed – rechecking');
      main();
    }
  });
}

// Keep the process alive (required for watch)
setInterval(() => {}, 1 << 30);
