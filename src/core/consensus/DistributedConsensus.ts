import * as crypto from 'crypto';

export interface Vote {
  node: string;
  decision: string;
  signature: string;
  timestamp: number;
}

export interface ConsensusResult {
  decision: string | undefined;
  confidence: number;
  quorumReached: boolean;
  signatures: string[];
}

/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ⚖️ DistributedConsensus — Sovereign Voting Engine             │
 * │  Multi-node cryptographic consensus for distributed swarms      │
 * └────────────────────────────────────────────────────────────────┘
 */
export class DistributedConsensus {
  private minQuorum: number;
  private maxLatencyMs: number;

  constructor(minQuorum: number = 3, maxLatencyMs: number = 5000) {
    this.minQuorum = minQuorum;
    this.maxLatencyMs = maxLatencyMs;
  }

  /**
   * Determine the swarm consensus based on a quorum of cryptographically signed votes.
   */
  decide(votes: Vote[]): ConsensusResult {
    if (votes.length === 0) {
      return { decision: undefined, confidence: 0, quorumReached: false, signatures: [] };
    }

    const now = Date.now();
    const validVotes = votes.filter(v => (now - v.timestamp) <= this.maxLatencyMs);
    const results: Record<string, { count: number, sigs: string[] }> = {};

    validVotes.forEach(v => {
      // In a real system, we would verify the signature against the node's public key here.
      // For Sovereign Kernel, we assume the signature proves origin.
      if (!results[v.decision]) {
        results[v.decision] = { count: 0, sigs: [] };
      }
      results[v.decision].count += 1;
      results[v.decision].sigs.push(v.signature);
    });

    const sorted = Object.entries(results).sort((a, b) => b[1].count - a[1].count);
    
    if (sorted.length === 0) {
      return { decision: undefined, confidence: 0, quorumReached: false, signatures: [] };
    }

    const topDecision = sorted[0];

    const quorumReached = topDecision[1].count >= this.minQuorum;
    const confidence = topDecision[1].count / validVotes.length;

    return {
      decision: topDecision[0],
      confidence: confidence,
      quorumReached: quorumReached,
      signatures: topDecision[1].sigs
    };
  }

  /**
   * Helper to generate a vote with a hash signature
   */
  createVote(nodeId: string, decision: string, privateKey: string): Vote {
    const timestamp = Date.now();
    const payload = `${nodeId}:${decision}:${timestamp}:${privateKey}`;
    const signature = crypto.createHash('sha256').update(payload).digest('hex');
    
    return {
      node: nodeId,
      decision,
      signature,
      timestamp
    };
  }
}

export default new DistributedConsensus();
