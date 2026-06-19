import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import QuorumArbitrator from "../runtime/QuorumArbitrator";
import CompilerGate from "../runtime/CompilerGate";
import AutoDreamEngine from "../runtime/AutoDreamEngine";

describe("Sovereign V50.0-Singularity Modules", () => {
  
  describe("Quorum Arbitrator (Byzantine Consensus)", () => {
    it("should approve safe tool executions with supermajority", async () => {
      const arbitrator = new QuorumArbitrator();
      const verdict = await arbitrator.evaluateConsensus("FileRead", { path: "src/main.ts" });
      expect(verdict.approved).toBe(true);
      expect(verdict.veto).toBe(false);
      expect(verdict.ratio).toBe(1.0);
    });

    it("should trigger immediate veto for destructive shell command lines", async () => {
      const arbitrator = new QuorumArbitrator();
      const verdict = await arbitrator.evaluateConsensus("ShellExecute", { command: "rm -rf /" });
      expect(verdict.approved).toBe(false);
      expect(verdict.veto).toBe(true);
      expect(verdict.reason).toContain("structural VETO");
    });

    it("should reject access to protected directory structures", async () => {
      const arbitrator = new QuorumArbitrator();
      const verdict = await arbitrator.evaluateConsensus("FileRead", { path: ".git/config" });
      expect(verdict.approved).toBe(false);
      expect(verdict.ratio).toBeLessThan(0.7);
      expect(verdict.reason).toContain("protected runtime");
    });
  });

  describe("Compiler Gate (Syntax Safeguards & Rollback)", () => {
    it("should successfully commit syntactically clean files", async () => {
      const gate = new CompilerGate(process.cwd());
      const testFile = path.resolve(process.cwd(), "scratch/stage_test.json");
      
      const res = await gate.verifyAndCommit(testFile, '{"valid": true}');
      expect(res.success).toBe(true);
      
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    });

    it("should roll back modification if syntax check fails", async () => {
      const gate = new CompilerGate(process.cwd());
      const testFile = path.resolve(process.cwd(), "scratch/stage_test.json");
      
      // Initialize with valid JSON
      fs.writeFileSync(testFile, '{"valid": true}');

      // Stage invalid JSON
      const res = await gate.verifyAndCommit(testFile, '{"invalid": json_error');
      expect(res.success).toBe(false);
      expect(res.error).toContain("CompilerGate aborted");

      // Verify the file was restored to its original valid state
      const currentContent = fs.readFileSync(testFile, "utf-8");
      expect(currentContent).toBe('{"valid": true}');

      fs.unlinkSync(testFile);
    });
  });

  describe("Auto-Dream Engine (Pattern Mining)", () => {
    it("should extract failure patterns from ledger logs", () => {
      const engine = new AutoDreamEngine(process.cwd());
      const mockLogs = [
        { tool: "Bash", allowed: false, durationMs: 120 },
        { tool: "Bash", allowed: false, durationMs: 80 },
        { tool: "FileRead", allowed: true, durationMs: 10 }
      ];

      const patterns = engine.analyzePatterns(mockLogs);
      expect(patterns.recurrentErrors).toContain("Bash");
      expect(patterns.avgLatency).toBe(70);
    });
  });
});
