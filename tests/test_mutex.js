/**
 * 🚀 E2E Test Suite for Mutex Locking, Comment Stripping, and Financial Guardrails
 */
const assert = require('assert');
const mutex = require('../core/utils/mutex_lock.js');
const stripper = require('../core/utils/comment_stripper.js');
const validator = require('../core/middleware/tool_arg_validator.js');

async function runTests() {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('   🔒 Aether Engine Advanced Safeguards Test Suite');
    console.log('════════════════════════════════════════════════════════════\n');

    // ─── Test 1: Mutex Lock Concurrency ─────────────────────────────
    console.log('🧪 Test 1: Mutex Lock Concurrency & Exp Backoff...');
    const dummyFile = 'dummy_transaction_log.js';
    
    // Acquire first lock
    const firstLock = await mutex.acquire(dummyFile, 'Agent-Alpha', 2000, 3);
    assert.strictEqual(firstLock, true, 'Alpha must acquire the lock first');
    assert.strictEqual(mutex.isLocked(dummyFile), true, 'Path must report locked');

    // Acquire concurrently with Beta (should succeed after wait/timeout if we release it)
    setTimeout(() => {
        mutex.release(dummyFile, 'Agent-Alpha');
    }, 400);

    const secondLock = await mutex.acquire(dummyFile, 'Agent-Beta', 2000, 3);
    assert.strictEqual(secondLock, true, 'Beta must acquire the lock after Alpha releases it');
    
    mutex.release(dummyFile, 'Agent-Beta');
    assert.strictEqual(mutex.isLocked(dummyFile), false, 'Path must be unlocked');
    console.log('  ✅ Mutex Lock Concurrency: PASSED');

    // ─── Test 2: Comment Stripping ──────────────────────────────────
    console.log('\n🧪 Test 2: Comment Stripping & Token Compression...');
    const rawJS = `
        // Temporary config
        const tax = 0.15; /* VAT */
        
        // Return active credit
        function getCredit() {
            return 100;
        }
    `;
    const cleanJS = stripper.compress('test.js', rawJS);
    assert.ok(!cleanJS.includes('// Temporary config'), 'Must strip single-line comments');
    assert.ok(!cleanJS.includes('/* VAT */'), 'Must strip block comments');
    assert.ok(cleanJS.includes('getCredit()'), 'Must preserve code structure');
    console.log('  ✅ Comment Stripper: PASSED');

    // ─── Test 3: Financial Guardrails Enforcer ──────────────────────
    console.log('\n🧪 Test 3: Financial Guardrails Enforcer...');
    
    // Test normal write (no finance words)
    const normalResult = validator.validateAndCorrect('FileWrite', {
        file_path: 'app.js',
        content: 'const a = 1; console.log(a);'
    });
    assert.strictEqual(normalResult.valid, true, 'Normal write must pass validator');

    // Test transaction-sensitive write
    const financialResult = validator.validateAndCorrect('FileWrite', {
        file_path: 'finance_app.js',
        content: 'const wallet = 1000; debit(wallet);'
    });
    assert.strictEqual(financialResult.valid, false, 'Financial write must be rejected by guardrails');
    assert.ok(financialResult.guidance.includes('FINANCIAL GUARDRAIL TRIGGERED'), 'Guidance must notify financial guardrail');
    console.log('  ✅ Financial Guardrails: PASSED');

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('  🎉 ALL ADVANCED SYSTEM SAFEGUARDS PASSED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════════════════════\n');
}

runTests().catch(err => {
    console.error('❌ TEST SUITE FAILED:', err);
    process.exit(1);
});
