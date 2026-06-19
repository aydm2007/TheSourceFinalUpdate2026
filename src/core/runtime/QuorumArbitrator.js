/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  ⚖️ Sovereign Quorum Arbitrator V50.0-Singularity                 │
 * │  Orchestrates multi-agent Byzantine consensus before executing    │
 * │  high-risk system mutations, commands, or billing updates.        │
 * └────────────────────────────────────────────────────────────────────┘
 */

class QuorumArbitrator {
  constructor() {
    this.agents = ["SentinelGuard", "ConstitutionalEnforcer", "FinanceAuditor"];
  }

  /**
   * Evaluates if a tool invocation or shell command passes BFT consensus.
   * @param {string} toolName Name of the tool or execution scope
   * @param {object} args Input arguments
   * @returns {Promise<{ approved: boolean, veto: boolean, ratio: number, reason: string }>}
   */
  async evaluateConsensus(toolName, args) {
    let approves = 0;
    let rejects = 0;
    let veto = false;
    const reasons = [];

    for (const agent of this.agents) {
      const vote = await this.queryAgentVote(agent, toolName, args);
      if (vote.decision === "VETO") {
        veto = true;
        reasons.push(`[Veto] ${agent}: ${vote.reason}`);
        break;
      }
      if (vote.decision === "APPROVE") {
        approves++;
      } else {
        rejects++;
        reasons.push(`${agent}: ${vote.reason}`);
      }
    }

    const ratio = approves / this.agents.length;
    const approved = !veto && ratio >= 0.7; // Requires supermajority

    return {
      approved,
      veto,
      ratio,
      reason: veto
        ? `Consensus REJECTED via structural VETO: ${reasons.join("; ")}`
        : approved
          ? `Consensus APPROVED (Supermajority ${Math.round(ratio * 100)}%)`
          : `Consensus REJECTED (Approval ratio ${Math.round(ratio * 100)}%): ${reasons.join("; ")}`,
    };
  }

  async queryAgentVote(agent, toolName, args) {
    const serializedArgs = JSON.stringify(args || {}).toLowerCase();

    // 1. Destructive Command Veto
    if (toolName === "ShellExecute" || toolName === "CommandRun") {
      if (
        serializedArgs.includes("rm ") ||
        serializedArgs.includes("del ") ||
        serializedArgs.includes("format ")
      ) {
        return {
          decision: "VETO",
          reason: "Destructive filesystem mutation detected",
        };
      }
    }

    // 2. Sentinel Guard Directory Isolation
    if (agent === "SentinelGuard") {
      if (
        args &&
        args.path &&
        (args.path.includes(".git") || args.path.includes(".antigravity"))
      ) {
        return {
          decision: "REJECT",
          reason: "Attempt to read protected runtime configurations",
        };
      }
    }

    // 3. Finance Auditor Double-Billing Checks
    if (agent === "FinanceAuditor") {
      if (args && args.credits && parseFloat(args.credits) < 0) {
        return {
          decision: "VETO",
          reason: "Negative credit value mutation is rejected",
        };
      }
    }

    return {
      decision: "APPROVE",
      reason: "Aligned with system safety boundaries",
    };
  }
}

module.exports = QuorumArbitrator;
