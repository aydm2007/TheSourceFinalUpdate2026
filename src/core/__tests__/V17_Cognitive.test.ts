import { describe, it, expect } from 'vitest';
const { SwarmRelocationAgent } = require('../swarm/SwarmRelocationAgent');
const { SelfEvolutionCompiler } = require('../evolution/SelfEvolutionCompiler');
const fs = require('fs');
const path = require('path');

describe('AETHER-ZENITH V17.0 Cognitive Singularity Integration', () => {
  it('should teleport quantum memory to a foreign workspace boundary', async () => {
    const nomad = new SwarmRelocationAgent();
    const foreignWorkspace = path.resolve(process.cwd(), 'scratch', 'foreign_project');
    
    // Create mock local memory
    if (!fs.existsSync(nomad.localMemoryPath)) {
      fs.mkdirSync(path.dirname(nomad.localMemoryPath), { recursive: true });
      fs.writeFileSync(nomad.localMemoryPath, '{"vectors": {"test": "data"}}', 'utf8');
    }

    const result = await nomad.teleportContext(foreignWorkspace);
    
    expect(result.success).toBe(true);
    expect(fs.existsSync(result.targetPath)).toBe(true);

    // Clean up
    if (fs.existsSync(foreignWorkspace)) {
      fs.rmSync(foreignWorkspace, { recursive: true, force: true });
    }
  });

  it('should distill cognitive rules from shadow_ledger and synthesize a new tool', async () => {
    const evolver = new SelfEvolutionCompiler();
    
    // Create a mock shadow_ledger to trigger distillation
    if (!fs.existsSync(evolver.ledgerPath)) {
      fs.mkdirSync(path.dirname(evolver.ledgerPath), { recursive: true });
      fs.writeFileSync(evolver.ledgerPath, '{"event":"UI_BUG_FIX_REPEATED"}\n{"event":"UI_BUG_FIX_REPEATED"}', 'utf8');
    }

    const result = await evolver.distillCognitiveRules();
    
    expect(result.evolved).toBe(true);
    expect(result.target).toBe('AutoFormatterTool.js');
    expect(result.code).toContain('AutoFormatterTool');
  });
});
