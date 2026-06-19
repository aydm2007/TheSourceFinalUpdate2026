// billing_rbac.test.js — Nexus Engine V7 Integration Tests for Billing and RBAC
// Run: node tests/billing_rbac.test.js

const assert = require('assert');
const path = require('path');
const dbManager = require('../core/db/db_manager.js');
const multiUserManager = require('../core/bridge/multi_user_manager.js');

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

async function runTests() {
  console.log('\n📊 Nexus Engine V7 — Billing & RBAC Tests\n');
  console.log('──────────────────────────────────────────────────\n');

  await dbManager.init();

  // Test User
  const testUserId = 'test_user_123';
  const testUser = {
    id: testUserId,
    username: 'test_dev',
    apikey: 'sk-test-123',
    role: 'Developer',
    allowed_tools: ['FileRead', 'TaskCreate']
  };

  await dbManager.addOrUpdateUser(testUser);

  console.log('🔐 RBAC Tests:');
  test('rbac', 'Developer should be allowed to use permitted tool', () => {
    const isAllowed = multiUserManager.isToolAllowed(testUser, 'FileRead');
    assert.strictEqual(isAllowed, true);
  });

  test('rbac', 'Developer should NOT be allowed to use unpermitted tool', () => {
    const isAllowed = multiUserManager.isToolAllowed(testUser, 'Bash');
    assert.strictEqual(isAllowed, false);
  });

  const adminUser = { role: 'Admin', allowed_tools: [] };
  test('rbac', 'Admin should be allowed to use ANY tool', () => {
    const isAllowed = multiUserManager.isToolAllowed(adminUser, 'Bash');
    assert.strictEqual(isAllowed, true);
  });

  console.log('\n💳 Billing Tests:');
  
  await dbManager.setWalletBalance(testUserId, 10, 'CREDITS');
  test('billing', 'Wallet balance should be 10', async () => {
    const wallet = await dbManager.getWalletBalance(testUserId);
    assert.strictEqual(wallet.balance, 10);
  });

  test('billing', 'deductBalance should accurately subtract credits', async () => {
    await dbManager.deductBalance(testUserId, 2.5);
    const wallet = await dbManager.getWalletBalance(testUserId);
    assert.strictEqual(wallet.balance, 7.5);
  });

  console.log('\n──────────────────────────────────────────────────\n');
  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  
  // Cleanup
  await dbManager.deleteUser(testUserId);
  
  if (failed === 0) {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  } else {
    console.log(`⚠️ ${failed} test(s) failed!\n`);
    process.exit(1);
  }
}

runTests();
