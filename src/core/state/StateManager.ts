import Redis from "ioredis";

class StateManager {
  private redis: Redis | null = null;
  private fallbackMap = new Map<string, string>();

  constructor() {
    try {
      this.redis = new Redis({
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        showFriendlyErrorStack: true,
      });
      this.redis.on("error", () => {
        this.redis = null;
      });
    } catch {
      this.redis = null;
    }
  }

  async set(key: string, value: any) {
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value));
        return;
      } catch {
        this.redis = null;
      }
    }
    this.fallbackMap.set(key, JSON.stringify(value));
  }

  async get(key: string) {
    if (this.redis) {
      try {
        const v = await this.redis.get(key);
        return JSON.parse(v || "null");
      } catch {
        this.redis = null;
      }
    }
    const v = this.fallbackMap.get(key);
    return JSON.parse(v || "null");
  }

  clear() {
    this.fallbackMap.clear();
  }
}

export default new StateManager();
