const assert = require('assert');
const RuntimeEvent = require('../src/core/runtime/RuntimeEvent');
const DeterministicScheduler = require('../src/core/runtime/DeterministicScheduler');

async function runIdempotencyTest() {
  console.log('🛡️ Starting Idempotency Test (Phase 2)...');
  
  const scheduler = new DeterministicScheduler();
  
  // 1. Create a single event
  const event = new RuntimeEvent('TEST_EVENT', { data: 42 });
  
  // 2. Enqueue the event multiple times
  scheduler.enqueue(event);
  scheduler.enqueue(event);
  scheduler.enqueue(event);
  
  // 3. Verify it was only processed once
  const state = scheduler.getCurrentState();
  assert.strictEqual(scheduler.eventLog.length, 1, 'Event log should contain exactly 1 event (duplicates dropped).');
  assert.strictEqual(scheduler.processedEventIds.has(event.id), true, 'Event ID should be marked as processed.');

  console.log('✅ Idempotency test passed: Duplicate events were correctly dropped.');
}

runIdempotencyTest().catch(err => {
  console.error('❌ Idempotency test failed:', err);
  process.exit(1);
});
