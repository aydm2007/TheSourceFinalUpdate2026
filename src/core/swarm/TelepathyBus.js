"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelepathyBus = void 0;
const ioredis_1 = require("ioredis");
const events_1 = require("events");
class TelepathyBus {
  pubClient = null;
  subClient = null;
  localBus;
  useRedis = false;
  constructor(redisUrl) {
    this.localBus = new events_1.EventEmitter();
    try {
      // Attempt to connect to Redis if URL provided, or fallback to local event bus
      if (redisUrl || process.env.REDIS_URL) {
        const url =
          redisUrl || process.env.REDIS_URL || "redis://localhost:6379";
        this.pubClient = new ioredis_1.default(url, {
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });
        this.subClient = new ioredis_1.default(url, {
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });
        this.pubClient.on("error", () => {
          this.useRedis = false;
        });
        this.pubClient.on("ready", () => {
          this.useRedis = true;
        });
        this.subClient.on("message", (channel, message) => {
          this.localBus.emit(channel, JSON.parse(message));
        });
      }
    } catch (e) {
      this.useRedis = false;
    }
  }
  async broadcast(channel, sender, payload) {
    const message = {
      id: Math.random().toString(36).substring(2, 15),
      sender,
      channel,
      payload,
      timestamp: Date.now(),
    };
    if (this.useRedis && this.pubClient) {
      await this.pubClient.publish(channel, JSON.stringify(message));
    } else {
      // Fallback to local process memory bus (useful for single-machine agent swarms)
      this.localBus.emit(channel, message);
    }
  }
  subscribe(channel, callback) {
    if (this.useRedis && this.subClient) {
      this.subClient.subscribe(channel).catch(() => {});
    }
    this.localBus.on(channel, callback);
  }
  async close() {
    if (this.pubClient) await this.pubClient.quit();
    if (this.subClient) await this.subClient.quit();
    this.localBus.removeAllListeners();
  }
}
exports.TelepathyBus = TelepathyBus;
