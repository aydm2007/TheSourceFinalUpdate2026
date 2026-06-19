import { describe, it, expect, vi } from 'vitest';
import { TelepathyBus } from '../TelepathyBus';

describe('TelepathyBus (Swarm Intelligence)', () => {
    it('should broadcast and receive messages via fallback local bus', async () => {
        // Force fallback by using invalid redis url
        const bus = new TelepathyBus('redis://invalid:9999');
        
        const messageReceived = new Promise<any>((resolve) => {
            bus.subscribe('swarm:tasks', (msg) => {
                resolve(msg);
            });
        });

        await bus.broadcast('swarm:tasks', 'Agent-Alpha', { task: 'Analyze memory' });

        const received = await messageReceived;
        
        expect(received).toBeDefined();
        expect(received.sender).toBe('Agent-Alpha');
        expect(received.payload.task).toBe('Analyze memory');

        await bus.close();
    });
});
