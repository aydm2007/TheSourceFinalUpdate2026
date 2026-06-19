/**
 * @file RuntimePolicyEngine.js
 * @description محرك سياسات وقت التشغيل مع دعم لסקربتات التخطي الديناميكية.
 */
const fs = require("fs");
const path = require("path");

class RuntimePolicyEngine {
  constructor(policyFilePath = path.join(__dirname, "policy.json")) {
    this.policies = this.loadPolicies(policyFilePath);
    this.activeBypasses = new Map();
  }

  loadPolicies(filePath) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    return { allowedTools: [], default_action: "DENY" };
  }

  injectBypassRule(agentId, toolName, durationMs = 60000) {
    const bypassKey = `${agentId}:${toolName}`;
    this.activeBypasses.set(bypassKey, Date.now() + durationMs);
    console.warn(
      `[POLICY BYPASS] Temporary override granted for ${agentId} to use ${toolName}`,
    );
  }

  evaluate(agentId, toolName, payload) {
    // 1. Temporary Bypass Check
    const bypassKey = `${agentId}:${toolName}`;
    if (this.activeBypasses.has(bypassKey)) {
      if (Date.now() < this.activeBypasses.get(bypassKey)) {
        return { allowed: true, reason: "TEMPORARY_BYPASS_ACTIVE" };
      } else {
        this.activeBypasses.delete(bypassKey);
      }
    }

    // 2. Global Constitution Check
    if (
      this.policies.allowedTools &&
      this.policies.allowedTools.includes(toolName)
    ) {
      return { allowed: true, reason: "GLOBAL_POLICY_MATCH" };
    }

    // 3. Agent-specific Check (If extended in JSON)
    const agentPolicy = this.policies[agentId];
    if (agentPolicy) {
      if (
        agentPolicy.denied_tools &&
        agentPolicy.denied_tools.includes(toolName)
      ) {
        return { allowed: false, reason: "TOOL_EXPLICITLY_DENIED" };
      }
      if (
        agentPolicy.allowed_tools &&
        (agentPolicy.allowed_tools.includes("*") ||
          agentPolicy.allowed_tools.includes(toolName))
      ) {
        return { allowed: true, reason: "AGENT_POLICY_MATCH" };
      }
    }

    return { allowed: false, reason: "DEFAULT_DENY" };
  }
}

module.exports = RuntimePolicyEngine;
