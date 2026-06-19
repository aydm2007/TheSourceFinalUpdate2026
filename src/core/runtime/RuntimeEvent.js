/**
 * @file RuntimeEvent.js
 * @description تعريف هيكل الحدث داخل بيئة التشغيل החتمية (Event-Sourced Runtime).
 */
const crypto = require("crypto");

class RuntimeEvent {
  /**
   * @param {string} type - نوع الحدث (مثل TOOL_EXECUTION, STATE_UPDATE)
   * @param {any} payload - حمولة الحدث
   * @param {string} agentId - المُعرّف للوكيل (Agent) الذي أصدر الحدث
   */
  constructor(type, payload, agentId = "SovereignKernel") {
    this.id = crypto.randomUUID();
    this.timestamp = Date.now();
    this.type = type;
    this.payload = payload;
    this.agentId = agentId;
  }

  /**
   * @returns {string} - الحتمية (Deterministic representation) للحدث
   */
  get hash() {
    return crypto
      .createHash("sha256")
      .update(
        `${this.id}:${this.timestamp}:${this.type}:${JSON.stringify(this.payload)}`,
      )
      .digest("hex");
  }
}

module.exports = RuntimeEvent;
