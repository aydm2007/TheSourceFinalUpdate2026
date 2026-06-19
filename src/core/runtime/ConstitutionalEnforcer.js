/**
 * @file ConstitutionalEnforcer.js
 * @description Enforcement logic against the RuntimeConstitution (Phase 0).
 */
const RuntimeConstitution = require("./RuntimeConstitution");

class ConstitutionalEnforcer {
  /**
   * @param {RuntimeConstitution} constitution
   */
  constructor(constitution = new RuntimeConstitution()) {
    this.constitution = constitution;
  }

  /**
   * Validates if a tool execution is constitutionally allowed.
   * @param {string} toolName
   * @throws {Error} if forbidden.
   */
  validateTool(toolName) {
    if (!this.constitution.allowedTools.includes(toolName)) {
      throw new Error(
        `CONSTITUTIONAL BREACH: Tool '${toolName}' is forbidden in the autonomous runtime.`,
      );
    }
  }

  /**
   * Checks runtime memory usage constraints.
   * @param {number} currentMemoryMB
   * @throws {Error} if memory limit exceeded.
   */
  validateMemory(currentMemoryMB) {
    if (currentMemoryMB > this.constitution.limits.memoryMB) {
      throw new Error(
        `CONSTITUTIONAL BREACH: Memory limit exceeded (${currentMemoryMB}MB > ${this.constitution.limits.memoryMB}MB).`,
      );
    }
  }

  /**
   * Checks capability constraints.
   * @param {string[]} requestedCapabilities
   */
  validateCapabilities(requestedCapabilities) {
    for (const cap of requestedCapabilities) {
      if (this.constitution.forbiddenCapabilities.includes(cap)) {
        throw new Error(
          `CONSTITUTIONAL BREACH: Capability '${cap}' is strictly forbidden.`,
        );
      }
    }
  }
}

module.exports = ConstitutionalEnforcer;
