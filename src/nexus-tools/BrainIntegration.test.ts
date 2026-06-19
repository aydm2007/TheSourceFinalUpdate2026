/**
 * Brain Integration Test — Sovereign Sigma V12.0
 * 
 * Verifies the coordination between Gemini 3 Flash (BrainChannel)
 * and the Nexus Engine toolset.
 */

import { expect, test, describe } from "bun:test";
import { brainChannel } from "./index.ts";

describe("Nexus Brain Orchestration", () => {
  test("Brain should successfully dispatch a diagnostic task", async () => {
    const result = await brainChannel.dispatch({
      task: "Verify system integrity",
      subsystem: "diagnostic",
      payload: { subsystem: "all" }
    });

    expect(result.data).toContain("[OK] AgentMemory");
    expect(result.data).toContain("✅ All systems operational");
  });

  test("Brain should successfully manage memory state", async () => {
    const result = await brainChannel.dispatch({
      task: "Check memory status",
      subsystem: "memory",
      payload: { action: "status", agentType: "general" }
    });

    expect(result.data).toContain("# MemoryManager Status");
    expect(result.data).toContain("**Agent Type**: general");
  });

  test("Brain should successfully generate an AutoDream plan", async () => {
    const result = await brainChannel.dispatch({
      task: "Plan system expansion",
      subsystem: "planning",
      payload: { goal: "Implement a new fiscal auditor agent" }
    });

    expect(result.data).toContain("# AutoDream Plan");
    expect(result.data).toContain("Implement a new fiscal auditor agent");
  });
});
