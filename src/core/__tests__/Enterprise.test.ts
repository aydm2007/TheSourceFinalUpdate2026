import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import EventBus from "../runtime/EventBus";
import queue, { Job } from "../runtime/QueueManager";
import WorkerPool from "../runtime/WorkerPool";
import StateManager from "../state/StateManager";
import CircuitBreaker from "../recovery/CircuitBreaker";
import HealingEngine from "../recovery/HealingEngine";
import DeadLetterQueue from "../recovery/DeadLetterQueue";
import consensus from "../consensus/Consensus";
import policyManager from "../consensus/PolicyManager";
import logger from "../observability/logger";
import { requests } from "../observability/metrics";
import { tracer } from "../observability/telemetry";
import skillSandbox from "../sandbox/SkillSandbox";

// V99 Additions
import { WorkflowEngine, TaskNode } from "../runtime/WorkflowEngine";
import LoadBalancer from "../runtime/LoadBalancer";
import ModelRouter from "../runtime/ModelRouter";
import SecretsVault from "../security/SecretsVault";
import ChaosEngine from "../recovery/ChaosEngine";
import EventStore from "../state/EventStore";
import AccessControl from "../security/AccessControl";
import SlaMonitor from "../observability/SlaMonitor";

// Shadow Ledger Addition
import shadowLedger from "../state/ShadowLedger";
import replayEngine from "../state/ReplayEngine";
import gov from "../security/Governance";

describe("Enterprise Core Infrastructure", () => {
  const testLedgerPath = path.join(".agents", "memory", "shadow_ledger_test.jsonl");

  beforeEach(() => {
    queue.clear();
    StateManager.clear();
    DeadLetterQueue.clear();
    policyManager.clear();
    SecretsVault.clear();
    EventStore.clear();
    AccessControl.clear();
    SlaMonitor.clear();

    shadowLedger.setLedgerPathForTest(testLedgerPath);
    if (fs.existsSync(testLedgerPath)) {
      fs.unlinkSync(testLedgerPath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(testLedgerPath)) {
      fs.unlinkSync(testLedgerPath);
    }
  });

  describe("A1 — Event-driven Runtime Core", () => {
    it("should publish and subscribe to events", () => {
      let received: any = null;
      EventBus.subscribe("test-event", (data) => {
        received = data;
      });
      EventBus.publish("test-event", { hello: "world" });
      expect(received).toEqual({ hello: "world" });
    });

    it("should enqueue and dequeue jobs in QueueManager", () => {
      const job: Job = { id: "1", task: "do-work" };
      queue.enqueue(job);
      expect(queue.size()).toBe(1);
      expect(queue.dequeue()).toEqual(job);
      expect(queue.size()).toBe(0);
    });

    it("should run tasks using WorkerPool", async () => {
      const worker = {
        execute: vi.fn().mockResolvedValue(true),
      };
      const pool = new WorkerPool();
      queue.enqueue({ id: "1", task: "task1" });

      // Run pool in background and stop it after a short delay
      const promise = pool.run(worker);
      await new Promise((r) => setTimeout(r, 20));
      pool.stop();
      await promise;

      expect(worker.execute).toHaveBeenCalled();
    });
  });

  describe("A2 — Distributed State with Fallback", () => {
    it("should store and retrieve values", async () => {
      await StateManager.set("key1", { state: "active" });
      const val = await StateManager.get("key1");
      expect(val).toEqual({ state: "active" });
    });
  });

  describe("A3 — Circuit Breaker", () => {
    it("should trip after failure threshold and reject executions", async () => {
      const breaker = new CircuitBreaker(2, 1000);
      const fn = vi.fn().mockRejectedValue(new Error("fail"));

      await expect(breaker.execute(fn)).rejects.toThrow("fail");
      await expect(breaker.execute(fn)).rejects.toThrow("fail");

      // Now circuit is open
      await expect(breaker.execute(fn)).rejects.toThrow("Circuit Open");
      expect(breaker.getIsOpen()).toBe(true);
    });
  });

  describe("A4 — Self-Healing", () => {
    it("should fall back to backup agent on failure", async () => {
      const primary = {
        execute: vi.fn().mockRejectedValue(new Error("primary crashed")),
      };
      const backup = {
        execute: vi.fn().mockResolvedValue("recovered value"),
      };

      const result = await HealingEngine.recover(primary, "input-data", backup);
      expect(result).toBe("recovered value");
      expect(primary.execute).toHaveBeenCalledWith("input-data");
      expect(backup.execute).toHaveBeenCalledWith("input-data");
    });
  });

  describe("A5 — Agent Consensus", () => {
    it("should select the vote with the highest score", () => {
      const votes = [
        { agent: "security", score: 0.91, result: "approve" },
        { agent: "audit", score: 0.81, result: "reject" },
      ];
      const decision = consensus.select(votes);
      expect(decision?.selected?.agent).toBe("security");
      expect(decision?.selected?.result).toBe("approve");
    });
  });

  describe("A6 — Policy Engine", () => {
    it("should correctly validate permissions", () => {
      policyManager.addPolicy("security-agent", ["delete-memory", "write-logs"]);
      expect(policyManager.canAccess("security-agent", "delete-memory")).toBe(true);
      expect(policyManager.canAccess("security-agent", "format-disk")).toBe(false);
    });
  });

  describe("A7 — Dead Letter Queue", () => {
    it("should push failed tasks and support retries", () => {
      DeadLetterQueue.push({ id: "job1", err: "timeout" });
      expect(DeadLetterQueue.size()).toBe(1);
      const failed = DeadLetterQueue.retryAll();
      expect(failed[0].id).toBe("job1");
      expect(DeadLetterQueue.size()).toBe(0);
    });
  });

  describe("A8 — Observability (Logger, Metrics & Tracing)", () => {
    it("should trace execution span and log metrics", () => {
      requests.inc();
      logger.info({ agent: "security", status: "ok" });
      
      const span = tracer.startSpan("agentExecution");
      expect(span).toBeDefined();
      span.end();
    });
  });

  describe("A9 — Sandbox Isolation for Skills", () => {
    it("should execute code inside a secure vm context", async () => {
      const result = await skillSandbox.run("input.val * 2", { val: 21 });
      expect(result).toBe(42);
    });
  });

  // ==========================================
  // V99 Operational Maturity Tests
  // ==========================================
  describe("P1 — Workflow DAG Engine", () => {
    it("should run tasks in dependency order", async () => {
      const executionOrder: string[] = [];
      const tasks: TaskNode[] = [
        {
          id: "taskA",
          deps: [],
          execute: async () => { executionOrder.push("A"); }
        },
        {
          id: "taskB",
          deps: ["taskA"],
          execute: async () => { executionOrder.push("B"); }
        },
        {
          id: "taskC",
          deps: ["taskA", "taskB"],
          execute: async () => { executionOrder.push("C"); }
        }
      ];

      const engine = new WorkflowEngine();
      await engine.run(tasks);
      expect(executionOrder).toEqual(["A", "B", "C"]);
    });

    it("should throw error on circular dependencies/deadlock", async () => {
      const tasks: TaskNode[] = [
        {
          id: "taskA",
          deps: ["taskB"],
          execute: async () => {}
        },
        {
          id: "taskB",
          deps: ["taskA"],
          execute: async () => {}
        }
      ];
      const engine = new WorkflowEngine();
      await expect(engine.run(tasks)).rejects.toThrow("Deadlock detected");
    });
  });

  describe("P2 — Adaptive Load Balancer", () => {
    it("should select the worker node with the least load", () => {
      const workers = [
        { id: "worker-1", load: 10 },
        { id: "worker-2", load: 2 },
        { id: "worker-3", load: 5 },
      ];
      const chosen = LoadBalancer.select(workers);
      expect(chosen?.id).toBe("worker-2");
    });
  });

  describe("P3 — Automatic Model Routing", () => {
    it("should route code and reasoning tasks to correct LLM models", () => {
      expect(ModelRouter.route({ type: "code" })).toBe("gpt-coder");
      expect(ModelRouter.route({ type: "reasoning" })).toBe("claude");
      expect(ModelRouter.route({ type: "standard" })).toBe("default");
    });
  });

  describe("P4 — Secrets Vault", () => {
    it("should encrypt and decrypt secrets securely", () => {
      SecretsVault.set("SUPER_SECRET_TOKEN", "my-secret-credentials");
      const val = SecretsVault.get("SUPER_SECRET_TOKEN");
      expect(val).toBe("my-secret-credentials");
    });

    it("should fallback to environment variables if secret is absent", () => {
      process.env.TEST_ENV_VAR = "env-val";
      const val = SecretsVault.get("TEST_ENV_VAR");
      expect(val).toBe("env-val");
      delete process.env.TEST_ENV_VAR;
    });
  });

  describe("P5 — Chaos Engineering", () => {
    it("should execute fine with 0% crash rate", () => {
      ChaosEngine.setCrashRate(0);
      const val = ChaosEngine.executeOrCrash(() => "success");
      expect(val).toBe("success");
    });

    it("should trigger simulated failure with 100% crash rate", () => {
      ChaosEngine.setCrashRate(1.0);
      expect(() => ChaosEngine.executeOrCrash(() => "success")).toThrow("ChaosEngine induced worker crash");
    });
  });

  describe("P6 — Event Sourcing", () => {
    it("should append events and rebuild state correctly", () => {
      EventStore.append("INCREMENT", { amount: 5 });
      EventStore.append("INCREMENT", { amount: 10 });
      EventStore.append("DECREMENT", { amount: 2 });

      interface CounterState {
        count: number;
      }
      const finalState = EventStore.rebuild<CounterState>((state, event) => {
        if (event.type === "INCREMENT") {
          return { count: state.count + event.payload.amount };
        }
        if (event.type === "DECREMENT") {
          return { count: state.count - event.payload.amount };
        }
        return state;
      }, { count: 0 });

      expect(finalState.count).toBe(13);
    });
  });

  describe("P7 — Zero-Trust Policy Engine", () => {
    it("should enforce granular permissions", () => {
      AccessControl.grant("security-agent", "delete-memory");
      expect(AccessControl.authorize("security-agent", "delete-memory")).toBe(true);
      expect(AccessControl.authorize("security-agent", "overwrite-config")).toBe(false);
      expect(AccessControl.authorize("audit-agent", "delete-memory")).toBe(false);
    });
  });

  describe("P8 — SLO / SLA Monitoring", () => {
    it("should record alerts on SLA latency violations", () => {
      SlaMonitor.setSLO({ availability: 99.99, latency: 150 });
      expect(SlaMonitor.checkLatency(100)).toBe(true);
      expect(SlaMonitor.checkLatency(200)).toBe(false);
      expect(SlaMonitor.getAlerts().length).toBe(1);
      expect(SlaMonitor.getAlerts()[0]).toContain("SLA Latency Violation");
    });
  });

  // ==========================================
  // Shadow Ledger Cryptographic Chain Tests
  // ==========================================
  describe("Shadow Ledger Immutability Chain", () => {
    it("should chain entries together with previous_hash links", async () => {
      const e1 = await shadowLedger.logEvent("run_command", { cmd: "dir" }, 45);
      expect(e1.previous_hash).toBe("0".repeat(64));
      expect(e1.hash).toBeDefined();

      const e2 = await shadowLedger.logEvent("view_file", { path: "main.ts" }, 12);
      expect(e2.previous_hash).toBe(e1.hash);
      expect(e2.hash).toBeDefined();

      const integrity = await shadowLedger.verifyIntegrity();
      expect(integrity.valid).toBe(true);
    });

    it("should detect tamper when a hash in the chain is modified", async () => {
      const e1 = await shadowLedger.logEvent("run_command", { cmd: "dir" }, 45);
      await shadowLedger.logEvent("view_file", { path: "main.ts" }, 12);

      // Tamper the file contents by manually replacing a hash
      const content = fs.readFileSync(testLedgerPath, "utf8");
      const lines = content.trim().split("\n");
      const obj = JSON.parse(lines[0]);
      obj.hash = "tampered-hash-value-123456";
      lines[0] = JSON.stringify(obj);
      fs.writeFileSync(testLedgerPath, lines.join("\n") + "\n");

      const integrity = await shadowLedger.verifyIntegrity();
      expect(integrity.valid).toBe(false);
      expect(integrity.message).toContain("Hash mismatch");
    });

    it("should support replaying and searching events", async () => {
      const tStart = new Date().toISOString();
      await new Promise((r) => setTimeout(r, 10));

      await shadowLedger.logEvent("find_files", { pattern: "*.ts" }, 8);
      await shadowLedger.logEvent("run_tests", { suite: "unit" }, 400);

      const replayed = await shadowLedger.replay(tStart);
      expect(replayed.length).toBe(2);

      const searchResult = await shadowLedger.search("unit");
      expect(searchResult.length).toBe(1);
      expect(searchResult[0].tool).toBe("run_tests");
    });
  });

  describe("ReplayEngine, DLQ, and Governance", () => {
    it("should replay ledger events to reconstruct state", () => {
      const events = [
        { tool: "memory.add", args: { key: "role", value: "admin" } },
        { tool: "run_command", args: { cmd: "npm run test" } },
        { tool: "memory.delete", args: { key: "role" } },
      ];
      const state = replayEngine.replay(events);
      expect(state.last_command).toBe("npm run test");
      expect(state.role).toBeUndefined();
    });

    it("should support dead letter queue retry popping", () => {
      DeadLetterQueue.clear();
      DeadLetterQueue.push({ id: "job1" });
      DeadLetterQueue.push({ id: "job2" });
      expect(DeadLetterQueue.size()).toBe(2);
      expect(DeadLetterQueue.retry()).toEqual({ id: "job1" });
      expect(DeadLetterQueue.size()).toBe(1);
    });

    it("should perform risk governance analysis", () => {
      expect(gov.approve({ name: "safe_action", risk: 0.1 })).toBe("approved");
      expect(gov.approve({ name: "risky_action", risk: 0.95 })).toBe("human-review");
      expect(gov.approve({ name: "blocked_action", risk: 1.0 })).toBe("rejected");
    });
  });
});
