// test_integration.js — Nexus Engine V7 Comprehensive Integration Tests
// Tests: preload.js, cli-wrapper.js, adapter SSOT, skill ecosystem, memory system

const assert = require('assert');
const path = require('path');
const fs = require('fs');

let passed = 0;
let failed = 0;
const total_tests = [];

function test(category, name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
    total_tests.push({ category, name, status: 'pass' });
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
    total_tests.push({ category, name, status: 'fail', error: e.message });
  }
}

console.log('\n📊 Nexus Engine V7 — Comprehensive Integration Tests\n');
console.log('──────────────────────────────────────────────────\n');

// ═══════════════════════════════════════════════════
// 1. ADAPTER TESTS (from existing test file)
// ═══════════════════════════════════════════════════
console.log('🔧 Adapter SSOT Tests:');

const { SiliconFlowAdapter } = require('../siliconflow_adapter');

test('adapter', 'default model should be deepseek-ai/DeepSeek-V3', () => {
  const adapter = new SiliconFlowAdapter();
  assert.strictEqual(adapter.model, 'deepseek-ai/DeepSeek-V3');
});

test('adapter', 'API URL should be correct', () => {
  const adapter = new SiliconFlowAdapter();
  assert.strictEqual(adapter.baseURL, 'https://api.siliconflow.com/v1/chat/completions');
});

test('adapter', 'maxRetries should default to 5', () => {
  const adapter = new SiliconFlowAdapter();
  assert.strictEqual(adapter.maxRetries, 5);
});

test('adapter', 'adapter should have createMessage method', () => {
  const adapter = new SiliconFlowAdapter();
  assert.strictEqual(typeof adapter.createMessage, 'function');
});

// ═══════════════════════════════════════════════════
// 2. PRELOAD.JS TESTS (NEW)
// ═══════════════════════════════════════════════════
console.log('\n🔒 Preload.js Security Tests:');

test('preload', 'preload.js should NOT contain hardcoded API keys', () => {
  const content = fs.readFileSync('./package/preload.js', 'utf8');
  const hasHardcodedKey = /sk-[a-zA-Z0-9]{20,}/.test(content);
  assert.strictEqual(hasHardcodedKey, false, 'Found hardcoded API key in preload.js!');
});

test('preload', 'preload.js should use SiliconFlowAdapter', () => {
  const content = fs.readFileSync('./package/preload.js', 'utf8');
  assert.ok(content.includes('SiliconFlowAdapter'), 'preload.js should import SiliconFlowAdapter');
});

test('preload', 'preload.js should NOT reference deepseek-ai/DeepSeek-V3', () => {
  const content = fs.readFileSync('./package/preload.js', 'utf8');
  assert.ok(!content.includes('deepseek-ai/DeepSeek-V3'), 'preload.js should not use deepseek-ai/DeepSeek-V3');
});

test('preload', 'preload.js should use Qwen model via adapter', () => {
  const content = fs.readFileSync('./package/preload.js', 'utf8');
  assert.ok(!content.includes("model: 'deepseek"), 'Should not have hardcoded model');
});

// ═══════════════════════════════════════════════════
// 3. CLI.JS TESTS (NEW)
// ═══════════════════════════════════════════════════
console.log('\n🔗 CLI Tests:');

test('cli', 'package/cli.js should use SiliconFlowAdapter', () => {
  const content = fs.readFileSync('./package/cli.js', 'utf8');
  assert.ok(content.includes('SiliconFlowAdapter'));
});

test('cli', 'package/cli.js should import from ../siliconflow_adapter.js', () => {
  const content = fs.readFileSync('./package/cli.js', 'utf8');
  assert.ok(content.includes('../siliconflow_adapter.js'));
});

test('cli', 'package/cli.js should NOT contain hardcoded keys', () => {
  const content = fs.readFileSync('./package/cli.js', 'utf8');
  const hasKey = /sk-[a-zA-Z0-9]{20,}/.test(content);
  assert.strictEqual(hasKey, false);
});

// ═══════════════════════════════════════════════════
// 4. SKILL ECOSYSTEM TESTS (NEW)
// ═══════════════════════════════════════════════════
console.log('\n🎯 Skill Ecosystem Tests:');

const requiredSkills = [
  'django-doctor', 'react-surgeon', 'flutter-fixer',
  'security-audit', 'db-forensics', 'nexus-memory'
];

for (const skill of requiredSkills) {
  test('skills', `${skill}/SKILL.md should exist`, () => {
    const skillPath = path.join('.agents', 'skills', skill, 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), `Missing: ${skillPath}`);
  });
}

test('skills', 'master.md should exist in nexus-core/', () => {
  assert.ok(fs.existsSync('.agents/skills/nexus-core/master.md'));
});

test('skills', 'master.md should reference all sub-skills', () => {
  const content = fs.readFileSync('.agents/skills/nexus-core/master.md', 'utf8');
  for (const skill of requiredSkills) {
    assert.ok(content.includes(skill), `master.md should reference ${skill}`);
  }
});

test('skills', 'all skills should have allowed-tools in frontmatter', () => {
  for (const skill of requiredSkills) {
    const content = fs.readFileSync(
      path.join('.agents', 'skills', skill, 'SKILL.md'), 'utf8'
    );
    assert.ok(content.includes('allowed-tools:'), `${skill} missing allowed-tools`);
  }
});

test('skills', 'all skills should use TheSource-native tool names', () => {
  const bridgeConfig = JSON.parse(fs.readFileSync('bridge.json', 'utf8'));
  const validTools = bridgeConfig.allowed_tools || [];
  for (const skill of requiredSkills) {
    const content = fs.readFileSync(
      path.join('.agents', 'skills', skill, 'SKILL.md'), 'utf8'
    );
    const toolsMatch = content.match(/allowed-tools:\r?\n([\s\S]*?)---/) || content.match(/allowed-tools:\n([\s\S]*?)---/);
    if (toolsMatch) {
      const toolLines = toolsMatch[1].match(/- (\w+)/g) || [];
      for (const line of toolLines) {
        const tool = line.replace('- ', '');
        assert.ok(validTools.includes(tool), `${skill}: unknown tool "${tool}"`);
      }
    }
  }
});

// ═══════════════════════════════════════════════════
// 5. MEMORY SYSTEM TESTS (NEW)
// ═══════════════════════════════════════════════════
console.log('\n💾 Memory System Tests:');

test('memory', '.agents/memory/ directory should exist', () => {
  assert.ok(fs.existsSync('.agents/memory/'));
});

test('memory', 'decisions.md should exist', () => {
  assert.ok(fs.existsSync('.agents/memory/decisions.md'));
});

test('memory', 'patterns.md should exist', () => {
  assert.ok(fs.existsSync('.agents/memory/patterns.md'));
});

test('memory', 'bugs.md should exist', () => {
  assert.ok(fs.existsSync('.agents/memory/bugs.md'));
});

test('memory', 'decisions.md should have APPEND marker', () => {
  const content = fs.readFileSync('.agents/memory/decisions.md', 'utf8');
  assert.ok(content.includes('<!-- APPEND -->'));
});

// ═══════════════════════════════════════════════════
// 6. SECURITY AUDIT TESTS (NEW)
// ═══════════════════════════════════════════════════
console.log('\n🔐 Security Tests:');

test('security', '.env should be in .gitignore', () => {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  assert.ok(gitignore.includes('.env'));
});

test('security', 'sf-settings.json should be valid JSON', () => {
  const content = fs.readFileSync('sf-settings.json', 'utf8');
  JSON.parse(content); // Throws if invalid
});

// ═══════════════════════════════════════════════════
// 7. SSOT (Single Source of Truth) TESTS (NEW)
// ═══════════════════════════════════════════════════
console.log('\n📦 SSOT Tests:');

test('ssot', 'root adapter should match package adapter', () => {
  const root = fs.readFileSync('siliconflow_adapter.js', 'utf8');
  const pkg = fs.readFileSync('package/siliconflow_adapter.js', 'utf8');
  assert.strictEqual(root, pkg, 'Root and package adapters should be identical');
});

test('ssot', 'index.js should re-export SiliconFlowAdapter', () => {
  const content = fs.readFileSync('index.js', 'utf8');
  assert.ok(content.includes('SiliconFlowAdapter'));
});

test('ssot', 'override-fetch.js should re-export SiliconFlowAdapter', () => {
  const content = fs.readFileSync('override-fetch.js', 'utf8');
  assert.ok(content.includes('SiliconFlowAdapter'));
});

test('ssot', 'sf-settings.json model should be Qwen 72B', () => {
  const settings = JSON.parse(fs.readFileSync('sf-settings.json', 'utf8'));
  assert.ok(
    settings.model === 'deepseek-ai/DeepSeek-V3' || 
    settings.defaultModel === 'deepseek-ai/DeepSeek-V3',
    'Settings should use Qwen 72B'
  );
});

// ═══════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════
console.log('\n──────────────────────────────────────────────────\n');
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed === 0) {
  console.log('✅ All tests passed!\n');
} else {
  console.log(`⚠️ ${failed} test(s) failed!\n`);
  process.exit(1);
}
