import { describe, it, expect, vi } from 'vitest';
import { ChaosEngine } from '../ChaosEngine';
import * as fs from 'fs';
import * as path from 'path';

describe('ChaosEngine (Immune System)', () => {
    it('should mutate a file and detect vulnerabilities', async () => {
        // Create a dummy file
        const dummyDir = path.resolve(process.cwd(), 'scratch/chaos_test');
        if (!fs.existsSync(dummyDir)) fs.mkdirSync(dummyDir, { recursive: true });
        
        const dummyFile = path.join(dummyDir, 'test_target.ts');
        fs.writeFileSync(dummyFile, `export const add = (a: number, b: number) => a + b;`);
        
        const engine = new ChaosEngine('scratch/chaos_test');
        
        // Spy on console to track execution
        const logSpy = vi.spyOn(console, 'log');
        
        await engine.runChaosCycle();
        
        // It should have restored the file
        const contentAfter = fs.readFileSync(dummyFile, 'utf8');
        expect(contentAfter).toBe(`export const add = (a: number, b: number) => a + b;`);
        
        // The logs should indicate a mutation occurred
        const logs = logSpy.mock.calls.map(c => c[0]).join('\n');
        expect(logs).toContain('Mutated test_target.ts');
        
        // Clean up
        fs.unlinkSync(dummyFile);
        vi.restoreAllMocks();
    });
});
