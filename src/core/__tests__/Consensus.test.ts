import { describe, it, expect } from 'vitest';
import { DistributedConsensus } from '../consensus/DistributedConsensus.js';

describe('Sovereign Core - Distributed Consensus', () => {
  it('should reach consensus when a quorum of valid signed votes is met', () => {
    const engine = new DistributedConsensus(2, 5000);
    
    const vote1 = engine.createVote('node-1', 'DEPLOY', 'priv-key-1');
    const vote2 = engine.createVote('node-2', 'DEPLOY', 'priv-key-2');
    const vote3 = engine.createVote('node-3', 'ABORT', 'priv-key-3');
    
    const result = engine.decide([vote1, vote2, vote3]);
    
    expect(result.decision).toBe('DEPLOY');
    expect(result.quorumReached).toBe(true);
    expect(result.confidence).toBeCloseTo(2/3);
    expect(result.signatures).toHaveLength(2);
  });

  it('should reject consensus if quorum is not met', () => {
    const engine = new DistributedConsensus(3, 5000);
    
    const vote1 = engine.createVote('node-1', 'DEPLOY', 'priv-key-1');
    const vote2 = engine.createVote('node-2', 'DEPLOY', 'priv-key-2');
    
    const result = engine.decide([vote1, vote2]);
    
    expect(result.decision).toBe('DEPLOY');
    expect(result.quorumReached).toBe(false); // Quorum requires 3
  });
});
