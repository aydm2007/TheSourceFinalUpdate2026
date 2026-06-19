/**
 * Unit Test for OmegaDiagnosticTool
 * 
 * Verifies that the diagnostic tool correctly reports health for 
 * AgentMemory, SLCR Local Relay, and Query Chain subsystems.
 */

import { expect, test, describe, spyOn } from "bun:test";
import { OmegaDiagnosticTool } from "./index.ts";
import { slcr } from "../../utils/teleport/localRelay.ts";

describe("OmegaDiagnosticTool", () => {
  test("should have correct name and properties", () => {
    expect(OmegaDiagnosticTool.name).toBe("NexusOmegaDiagnostic");
    expect(OmegaDiagnosticTool.userFacingName()).toBe("NexusOmegaDiagnostic");
  });

  test("should report successful diagnostics for all subsystems", async () => {
    // Mock slcr.list to return empty array
    const slcrListSpy = spyOn(slcr, "list").mockReturnValue([]);

    const result = await OmegaDiagnosticTool.call(
      { subsystem: "all" },
      { 
        getAppState: () => ({ toolPermissionContext: { mode: 'default' } }),
        messages: [],
        setAppState: () => {},
      } as any
    );

    expect(result.data).toContain("[OK] AgentMemory");
    expect(result.data).toContain("[OK] SLCR_LocalRelay");
    expect(result.data).toContain("[OK] QueryChainTracking");
    expect(result.data).toContain("✅ All systems operational");
    
    slcrListSpy.mockRestore();
  });

  test("should handle relay subsystem error gracefully", async () => {
    // Mock slcr.list to throw an error
    const slcrListSpy = spyOn(slcr, "list").mockImplementation(() => {
      throw new Error("Relay Fault Simulation");
    });

    const result = await OmegaDiagnosticTool.call(
      { subsystem: "relay" },
      { 
        getAppState: () => ({}),
        messages: [],
      } as any
    );

    expect(result.data).toContain("[ERROR] SLCR_LocalRelay: Local relay fault: Error: Relay Fault Simulation");
    expect(result.data).toContain("⚠️  Some subsystems reported warnings or errors.");
    
    slcrListSpy.mockRestore();
  });

  test("should report memory directory for specific agent type", async () => {
    const result = await OmegaDiagnosticTool.call(
      { subsystem: "memory", agentType: "test-agent" },
      { 
        getAppState: () => ({}),
        messages: [],
      } as any
    );

    expect(result.data).toContain("AgentMemory: Memory dir resolved");
    expect(result.data).toContain("agentType=test-agent");
  });
});
