import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MapDrivenHealer } from '../gps/MapDrivenHealer.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Sovereign Core - GPS MapDrivenHealer', () => {
  it('should parse stack trace and return a failure if source map does not exist', async () => {
    const healer = new MapDrivenHealer('/non-existent-workspace');
    await healer.init();
    
    const fakeStack = `Error: Something went wrong
    at CentralOrchestrator.executeSovereignPipeline (/path/to/cli.js:100:20)`;
    
    const result = await healer.healFromError(fakeStack);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Source map not loaded.');
  });
});
