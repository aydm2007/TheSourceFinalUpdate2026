// bridgeHealth.test.js — Relay Bridge Health Verification Test
// Run: node bridgeHealth.test.js

const assert = require('assert');
const { RelayBridge } = require('../relay_bridge.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${e.message}`);
  }
}

// Environment isolation helper
const envVars = [
  'AETHER_SF_KEYS',
  'SILICONFLOW_KEYS',
  'SILICONFLOW_API_KEY_AYMAN',
  'SILICONFLOW_BASE_URL',
  'AETHER_OR_KEYS',
  'OPENROUTER_API_KEY',
  'OPENROUTER_KEYS',
  'OPENROUTER_BASE_URL',
  'AETHER_RELAY_KEY_ALPHA',
  'AETHER_RELAY_KEY_BETA',
  'GITHUB_MODELS_TOKEN',
  'GITHUB_MODELS_URL',
  'AETHER_PROVIDER',
  'AETHER_MODEL',
  'AETHER_PLANNER_MODEL',
  'AETHER_EXECUTOR_MODEL',
  'AETHER_OPENROUTER_PATTERNS',
  'AETHER_MAX_RETRIES',
  'AETHER_RETRY_DELAY_MS',
  'AETHER_TIMEOUT_MS'
];

const backup = {};
for (const key of envVars) {
  backup[key] = process.env[key];
}

function clearEnv() {
  for (const key of envVars) {
    delete process.env[key];
  }
}

function restoreEnv() {
  for (const key of envVars) {
    if (backup[key] !== undefined) {
      process.env[key] = backup[key];
    } else {
      delete process.env[key];
    }
  }
}

console.log('\n📊 Aether Engine — Relay Bridge Health Test\n');
console.log('─'.repeat(50));

test('RelayBridge healthCheck should return active status when key is provided', () => {
  clearEnv();
  const bridge = new RelayBridge('test-api-key-123');
  const health = bridge.healthCheck();
  assert.strictEqual(health.status, 'active');
  restoreEnv();
});

test('RelayBridge healthCheck should return dormant status when no key is provided', () => {
  clearEnv();
  const bridge = new RelayBridge(null);
  const health = bridge.healthCheck();
  assert.strictEqual(health.status, 'dormant');
  restoreEnv();
});

console.log('─'.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

if (failed === 0) {
  console.log('✅ BRIDGE HEALTH TESTS PASSED!\n');
} else {
  console.error('❌ SOME TESTS FAILED!\n');
  process.exit(1);
}
