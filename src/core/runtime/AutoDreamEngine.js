/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  🌙 Sovereign Auto-Dream Engine V50.0-Singularity                 │
 * │  Performs continuous background reflection over shadow ledger      │
 * │  mining structural failure trends and refining context weights.   │
 * └────────────────────────────────────────────────────────────────────┘
 */
const fs = require("fs");
const path = require("path");

class AutoDreamEngine {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot || process.cwd();
    this.isReflecting = false;
    this.shadowLedgerPath = path.join(
      this.workspaceRoot,
      ".agents",
      "memory",
      "shadow_ledger.jsonl",
    );
  }

  /**
   * Triggers asynchronous background pattern analysis and prompt tuning.
   */
  async triggerReflection() {
    if (this.isReflecting) return;
    this.isReflecting = true;

    // Run asynchronously to not block tool execution
    Promise.resolve().then(async () => {
      try {
        const logs = await this.readActiveLedger();
        if (logs.length < 5) return;

        const patterns = this.analyzePatterns(logs);
        if (patterns.recurrentErrors.length > 0) {
          await this.evolveSystemRules(patterns.recurrentErrors);
        }
      } catch (err) {
        // Silently log or trace inside standard error streams
        console.warn(`[Auto-Dream] Reflection loop warning: ${err.message}`);
      } finally {
        this.isReflecting = false;
      }
    });
  }

  async readActiveLedger() {
    if (!fs.existsSync(this.shadowLedgerPath)) return [];
    try {
      const content = fs.readFileSync(this.shadowLedgerPath, "utf-8");
      return content
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return {};
          }
        });
    } catch (e) {
      return [];
    }
  }

  analyzePatterns(logs) {
    const errorFrequencies = {};
    let totalLatency = 0;

    logs.forEach((log) => {
      totalLatency += log.durationMs || 0;
      if (log.tool && log.allowed === false) {
        errorFrequencies[log.tool] = (errorFrequencies[log.tool] || 0) + 1;
      }
      if (log.type && log.type.endsWith("_FAILURE")) {
        errorFrequencies[log.type] = (errorFrequencies[log.type] || 0) + 1;
      }
    });

    const recurrentErrors = Object.entries(errorFrequencies)
      .filter(([_, count]) => count >= 2)
      .map(([type]) => type);

    return {
      avgLatency: totalLatency / logs.length,
      recurrentErrors,
    };
  }

  async evolveSystemRules(errors) {
    const constitutionPath = path.join(
      this.workspaceRoot,
      "PROJECT_CONSTITUTION.md",
    );
    const directive = `[Auto-Dream V50.0] Repeated failures detected for ${errors.join(", ")}. Restrict high-concurrency tool execution on these targets until diagnostic checks pass.`;

    try {
      let content = "";
      if (fs.existsSync(constitutionPath)) {
        content = fs.readFileSync(constitutionPath, "utf-8");
      }

      // Only append if the error pattern is not already documented
      if (!content.includes(errors[0])) {
        fs.appendFileSync(constitutionPath, `\n- ${directive}\n`);
      }
    } catch (e) {}
  }
}

module.exports = AutoDreamEngine;
