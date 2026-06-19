/**
 * @file RuntimeConstitution.js
 * @description الدستور التنفيذي الحقيقي للبيئة السيادية (Phase 0/2 DSL).
 */
const fs = require("fs");
const path = require("path");

/**
 * Object holding the absolute constitutional limits of the runtime.
 */
class RuntimeConstitution {
  constructor() {
    this.loadPolicy();
  }

  loadPolicy() {
    try {
      const policyPath = path.join(__dirname, "policy.json");
      const policyData = fs.readFileSync(policyPath, "utf8");
      const config = JSON.parse(policyData);

      this.allowedTools = config.allowedTools;
      this.forbiddenCapabilities = config.forbiddenCapabilities;
      this.networkPolicies = config.networkPolicies;
      this.executionBudgets = config.executionBudgets;
      this.admissionControl = config.admissionControl;
    } catch (err) {
      console.warn(
        "⚠️ [Constitution] Failed to load policy.json, falling back to safe defaults.",
      );
      // Fallback
      this.allowedTools = [];
      this.forbiddenCapabilities = [
        "ROOT_SHELL",
        "UNRESTRICTED_NETWORK",
        "EVAL",
        "DIRECT_DB_DROP",
      ];
      this.networkPolicies = ["localhost"];
      this.executionBudgets = { cpuMs: 1000, memoryMB: 256, maxSteps: 10 };
      this.admissionControl = {
        maxQueueLength: 500,
        bucketCapacity: 50,
        tokenRefillRateMs: 200,
      };
    }
  }

  get limits() {
    return this.executionBudgets;
  }
}

module.exports = RuntimeConstitution;
