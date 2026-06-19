import { describe, it, expect } from 'vitest';
import { MirrorRoom } from '../MirrorRoom';

describe('MirrorRoom (Self-Optimizing Kernel)', () => {
    it('should parse shadow_ledger telemetry and identify bottlenecks', async () => {
        const mirror = new MirrorRoom();
        const optimizationReport = await mirror.selfOptimize();
        
        expect(optimizationReport).toContain('[MirrorRoom]');
        expect(optimizationReport).toContain('Self-Optimization Analysis');
    });
});
