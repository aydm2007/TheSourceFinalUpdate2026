import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface SwarmMessage {
    id: string;
    sender: string;
    channel: string;
    payload: any;
    timestamp: number;
}

export class TelepathyBus {
    private pubClient: Redis | null = null;
    private subClient: Redis | null = null;
    private localBus: EventEmitter;
    private useRedis: boolean = false;

    constructor(redisUrl?: string) {
        this.localBus = new EventEmitter();
        try {
            // Attempt to connect to Redis if URL provided, or fallback to local event bus
            if (redisUrl || process.env.REDIS_URL) {
                const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
                this.pubClient = new Redis(url, { maxRetriesPerRequest: 1, retryStrategy: () => null });
                this.subClient = new Redis(url, { maxRetriesPerRequest: 1, retryStrategy: () => null });
                
                this.pubClient.on('error', () => { this.useRedis = false; });
                this.pubClient.on('ready', () => { this.useRedis = true; });
                
                this.subClient.on('message', (channel, message) => {
                    this.localBus.emit(channel, JSON.parse(message));
                });
            }
        } catch (e) {
            this.useRedis = false;
        }
    }

    public async broadcast(channel: string, sender: string, payload: any): Promise<void> {
        const message: SwarmMessage = {
            id: Math.random().toString(36).substring(2, 15),
            sender,
            channel,
            payload,
            timestamp: Date.now()
        };

        if (this.useRedis && this.pubClient) {
            await this.pubClient.publish(channel, JSON.stringify(message));
        } else {
            // Fallback to local process memory bus (useful for single-machine agent swarms)
            this.localBus.emit(channel, message);
        }
    }

    public subscribe(channel: string, callback: (msg: SwarmMessage) => void): void {
        if (this.useRedis && this.subClient) {
            this.subClient.subscribe(channel).catch(() => {});
        }
        this.localBus.on(channel, callback);
    }

    public async close(): Promise<void> {
        if (this.pubClient) await this.pubClient.quit();
        if (this.subClient) await this.subClient.quit();
        this.localBus.removeAllListeners();
    }
}
