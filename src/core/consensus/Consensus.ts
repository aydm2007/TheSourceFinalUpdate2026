export interface Vote {
  agent: string;
  score: number;
  result: any;
  rationale?: string;
}

export interface LocalConsensusResult {
  selected: Vote | undefined;
  confidence: number;
  tied: boolean;
}

/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🧠 LocalConsensus — Sovereign Agent Consensus Engine          │
 * │  Selects the optimal execution path based on multi-agent votes │
 * └────────────────────────────────────────────────────────────────┘
 */
export class Consensus {
  private minScoreThreshold: number;

  constructor(minScoreThreshold: number = 0.5) {
    this.minScoreThreshold = minScoreThreshold;
  }

  /**
   * Evaluates agent votes and selects the highest scoring outcome.
   * Enforces minimum score threshold to prevent acceptance of poor decisions.
   */
  select(votes: Vote[]): LocalConsensusResult {
    if (votes.length === 0) {
      return { selected: undefined, confidence: 0, tied: false };
    }

    // Filter out votes below the minimum viable threshold
    const validVotes = votes.filter(v => v.score >= this.minScoreThreshold);
    
    if (validVotes.length === 0) {
       return { selected: undefined, confidence: 0, tied: false };
    }

    // Sort descending by score
    const sorted = [...validVotes].sort((a, b) => b.score - a.score);
    
    const topVote = sorted[0];
    let tied = false;

    // Check for ties at the top level
    if (sorted.length > 1 && sorted[0].score === sorted[1].score) {
      tied = true;
      // Tie breaker logic: we could use agent reputation or simply take the first.
      // For Sovereign Kernel, we'll flag it as tied so the Orchestrator can request human review if needed.
    }

    // Calculate confidence margin (difference between top and second place)
    const confidence = sorted.length > 1 ? (sorted[0].score - sorted[1].score) : sorted[0].score;

    return {
      selected: topVote,
      confidence,
      tied
    };
  }
}

export default new Consensus();
