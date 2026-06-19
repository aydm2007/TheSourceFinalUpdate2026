/**
 * @file src/simulation/ChaosFederationHarness.js
 * @description محاكاة العناقيد الموزعة مع Quorum Consensus — لا يعتمد على ESM Kernel مباشرة.
 */

const HybridLogicalClock = require("../core/runtime/HybridLogicalClock");

/**
 * MockNode — نواة خفيفة للمحاكاة فقط (تتجنب ESM import)
 */
class MockNode {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.hlc = new HybridLogicalClock();
    this.isBooted = false;
    this.eventLog = [];
  }

  async boot(options = {}) {
    this.isBooted = true;
  }

  async processEvent(eventName, payload) {
    if (!this.isBooted) await this.boot();
    const ts = this.hlc.tick();
    this.eventLog.push({ eventName, payload, ts });
    return { nodeId: this.nodeId, ts, committed: true };
  }
}

class ChaosFederationHarness {
  constructor(nodeCount = 3) {
    this.nodes = new Map();
    for (let i = 1; i <= nodeCount; i++) {
      this.nodes.set(`node_${i}`, new MockNode(`node_${i}`));
    }
    this.crashedNodes = new Set();
  }

  simulateNodeCrash(nodeId) {
    console.warn(`\n🐒 [CHAOS MONKEY] Pulling the plug on ${nodeId}...`);
    this.crashedNodes.add(nodeId);
  }

  async broadcastEvent(agentId, eventName, payload, cliDirectives = {}) {
    console.log(
      `\n📡 [FEDERATION] Broadcasting "${eventName}" to ${this.nodes.size}-node cluster...`,
    );
    let acks = 0;
    const quorum = Math.floor(this.nodes.size / 2) + 1;

    for (const [nodeId, node] of this.nodes.entries()) {
      try {
        if (this.crashedNodes.has(nodeId)) {
          if (cliDirectives.ignoreDeadNodes) {
            console.log(`   ↳ [BYPASS] Skipping dead node: ${nodeId}`);
            continue;
          }
          throw new Error(`NETWORK_TIMEOUT — ${nodeId} is unreachable`);
        }

        const result = await node.processEvent(eventName, payload);
        acks++;
        console.log(`   ✅ [ACK] ${nodeId} committed @ HLC ${result.ts}`);
      } catch (err) {
        console.error(`   ❌ [FAIL] ${nodeId}: ${err.message}`);
      }
    }

    if (acks >= quorum) {
      console.log(
        `\n✅ [QUORUM MET] ${acks}/${this.nodes.size} nodes ACK'd. Consensus achieved.`,
      );
      return true;
    } else {
      console.error(
        `\n🚨 [SPLIT BRAIN] Only ${acks}/${this.nodes.size} ACKs — below quorum of ${quorum}. HALTED.`,
      );
      return false;
    }
  }

  getNodeLogs() {
    const logs = {};
    for (const [nodeId, node] of this.nodes.entries()) {
      logs[nodeId] = node.eventLog;
    }
    return logs;
  }
}

module.exports = ChaosFederationHarness;
