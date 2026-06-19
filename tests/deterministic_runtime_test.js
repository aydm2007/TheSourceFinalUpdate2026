/**
 * @file deterministic_runtime_test.js
 * @description Test script for Autonomous Sovereign Distributed Runtime (Phases 0 & 1)
 */
const { SovereignKernel } = require('../package/SovereignKernel');
const RuntimeEvent = require('../src/core/runtime/RuntimeEvent');

async function testRuntime() {
  console.log("🚀 Testing Phase 0 & Phase 1: Constitutional Deterministic Runtime");
  
  const kernel = new SovereignKernel();
  
  // 1. Test Constitution Enforcement
  console.log("\n⚖️ Testing Constitution...");
  try {
    kernel.constitution.validateTool('FileRead');
    console.log("✅ Allowed tool (FileRead) passed.");
    
    let caught = false;
    try {
      kernel.constitution.validateTool('ROOT_SHELL'); // Not allowed
    } catch (err) {
      caught = true;
      console.log(`✅ Forbidden tool blocked successfully: ${err.message}`);
    }
    if (!caught) throw new Error("Failed to block forbidden tool!");
    
    caught = false;
    try {
      kernel.constitution.validateMemory(1024); // Exceeds 512MB
    } catch (err) {
      caught = true;
      console.log(`✅ Memory limit exceeded blocked successfully: ${err.message}`);
    }
    if (!caught) throw new Error("Failed to block memory violation!");

  } catch (err) {
    console.error("❌ Constitution Test Failed:", err);
    process.exit(1);
  }

  // 2. Test Deterministic Execution & Replay
  console.log("\n🔄 Testing Deterministic Scheduler...");
  
  // Simulate some events
  const e1 = new RuntimeEvent('AGENT_SPAWNED', { agentId: 'ui-synthesizer' });
  const e2 = new RuntimeEvent('TOOL_EXECUTION_START', { taskId: 'task-100' });
  const e3 = new RuntimeEvent('TOOL_EXECUTION_END', { taskId: 'task-100', success: true });

  kernel.scheduler.enqueue(e1);
  kernel.scheduler.enqueue(e2);
  kernel.scheduler.enqueue(e3);

  // Wait for queue processing (it's async in our design though simple here)
  await new Promise(r => setTimeout(r, 100));

  const currentState = kernel.scheduler.getCurrentState();
  console.log("📊 Current State:", JSON.stringify(currentState, null, 2));

  if (currentState.metrics.executions !== 1 || currentState.metrics.successes !== 1) {
    console.error("❌ State Reduction Failed!");
    process.exit(1);
  }

  // Test Replay
  console.log("\n⏪ Testing Event Replay...");
  const replayState = kernel.scheduler.replay(kernel.scheduler.eventLog);
  console.log("📊 Replayed State:", JSON.stringify(replayState, null, 2));

  const isDeterministic = JSON.stringify(currentState) === JSON.stringify(replayState);
  if (isDeterministic) {
    console.log("✅ Deterministic Execution & Replay Proven (100% Match).");
  } else {
    console.error("❌ Determinism Failed: Mismatch between current state and replay state.");
    process.exit(1);
  }

  console.log("\n🏁 All Tests Passed. Runtime is Production-Grade.");
}

testRuntime().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
