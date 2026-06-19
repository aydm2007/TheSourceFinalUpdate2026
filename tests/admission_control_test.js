const assert = require('assert');
const AdmissionController = require('../src/core/runtime/AdmissionController');

async function runAdmissionControlTest() {
  console.log('🚦 Starting Admission Control Test (Phase 2)...');
  
  const admission = new AdmissionController({
    maxQueueLength: 5,
    bucketCapacity: 3,
    tokenRefillRateMs: 1000 // Slow refill
  });

  // 1. Test Request Shedding
  assert.strictEqual(admission.shouldReject(4), false, 'Should accept queue length < max');
  assert.strictEqual(admission.shouldReject(5), true, 'Should reject queue length >= max');
  assert.strictEqual(admission.shouldReject(10), true, 'Should reject queue length > max');
  
  // 2. Test Token Bucket Rate Limiting
  assert.strictEqual(admission.consume(1), true, 'Token 1 consumed');
  assert.strictEqual(admission.consume(1), true, 'Token 2 consumed');
  assert.strictEqual(admission.consume(1), true, 'Token 3 consumed');
  assert.strictEqual(admission.consume(1), false, 'Token 4 should fail (bucket empty)');
  
  // 3. Simulate time passing to refill
  console.log('⏳ Waiting 1.1s for token refill...');
  await new Promise(resolve => setTimeout(resolve, 1100));
  
  assert.strictEqual(admission.consume(1), true, 'Token should be available after refill');

  console.log('✅ Admission control test passed: Request shedding and Token Bucket work correctly.');
}

runAdmissionControlTest().catch(err => {
  console.error('❌ Admission control test failed:', err);
  process.exit(1);
});
