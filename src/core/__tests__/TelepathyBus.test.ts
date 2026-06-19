import { describe, it, expect, vi } from 'vitest';
import { TelepathyBus } from '../swarm/TelepathyBus.js';

describe('Sovereign Core - TelepathyBus IPC', () => {
  it('should broadcast and receive messages locally when redis is offline', async () => {
    const bus = new TelepathyBus(); // no redis url, local fallback
    
    const handler = vi.fn();
    bus.subscribe('test-channel', handler);
    
    await bus.broadcast('test-channel', 'agent-alpha', { command: 'SYNC' });
    
    expect(handler).toHaveBeenCalledTimes(1);
    const msg = handler.mock.calls[0][0];
    expect(msg.sender).toBe('agent-alpha');
    expect(msg.payload.command).toBe('SYNC');
    
    await bus.close();
  });
});
