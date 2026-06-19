/**
 * Unit Test for MemoryManagerTool
 * 
 * Verifies action handling: load, status, and distill.
 */

import { expect, test, describe, spyOn, mock } from "bun:test";
import { MemoryManagerTool } from "./index.ts";
import * as agentMemory from "../../tools/AgentTool/agentMemory.ts";

describe("MemoryManagerTool", () => {
  test("should have correct name and properties", () => {
    expect(MemoryManagerTool.name).toBe("NexusMemoryManager");
    expect(MemoryManagerTool.userFacingName()).toBe("NexusMemoryManager");
  });

  test("should load memory prompt", async () => {
    const loadSpy = spyOn(agentMemory, "loadAgentMemoryPrompt").mockReturnValue("MOCK_PROMPT_CONTENT");

    const result = await MemoryManagerTool.call(
      { action: "load", agentType: "general", scope: "project" },
      {} as any
    );

    expect(result.data).toContain("# Memory Loaded");
    expect(result.data).toContain("MOCK_PROMPT_CONTENT");
    
    loadSpy.mockRestore();
  });

  test("should report memory status", async () => {
    spyOn(agentMemory, "getAgentMemoryDir").mockReturnValue("/mock/dir");
    spyOn(agentMemory, "getAgentMemoryEntrypoint").mockReturnValue("/mock/dir/MEMORY.md");

    const result = await MemoryManagerTool.call(
      { action: "status", agentType: "general", scope: "project" },
      {} as any
    );

    expect(result.data).toContain("# MemoryManager Status");
    expect(result.data).toContain("**Agent Type**: general");
    expect(result.data).toContain("**Directory**: /mock/dir");
  });

  test("should distill tool pattern", async () => {
    const distillSpy = spyOn(agentMemory, "distillToolPattern").mockImplementation(async () => {});

    const result = await MemoryManagerTool.call(
      { 
        action: "distill", 
        agentType: "coder", 
        scope: "project",
        tool: "FileEdit",
        pattern: "Always check imports",
        outcome: "success"
      },
      {} as any
    );

    expect(result.data).toContain("✅ Pattern distilled into SEMANTIC_HISTORY.md");
    expect(result.data).toContain("- Tool: FileEdit");
    expect(result.data).toContain("- Pattern: Always check imports");
    
    expect(distillSpy).toHaveBeenCalled();
    distillSpy.mockRestore();
  });

  test("should fail distill if missing parameters", async () => {
    const result = await MemoryManagerTool.call(
      { action: "distill", agentType: "coder" },
      {} as any
    );

    expect(result.data).toContain("❌ distill action requires: tool, pattern, outcome fields.");
  });
});
