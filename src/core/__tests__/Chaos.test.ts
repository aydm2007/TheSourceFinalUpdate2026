import { describe, it, expect } from "vitest";
import { ChaosEngine } from "../recovery/ChaosEngine";
import { RecoveryGraph } from "../recovery/RecoveryGraph";

describe("Chaos and Self-Healing Recovery", () => {
  it("should simulate a worker crash and recover successfully", async () => {
    const chaos = new ChaosEngine(1.0); // 100% crash rate
    const system = new RecoveryGraph();

    let didCrash = false;
    try {
      chaos.executeOrCrash(() => {
        return "running normal job";
      });
    } catch (err: any) {
      didCrash = true;
      const recovered = await system.recover({ type: "agent", message: err.message });
      expect(recovered).toBe("restartAgent");
    }

    expect(didCrash).toBe(true);
  });

  it("should handle network recovery paths dynamically", async () => {
    const system = new RecoveryGraph();
    const recovered = await system.recover({ type: "network" });
    expect(recovered).toBe("switchRegion");
  });

  it("should handle memory recovery paths dynamically", async () => {
    const system = new RecoveryGraph();
    const recovered = await system.recover({ type: "memory" });
    expect(recovered).toBe("restartMemory");
  });
});
