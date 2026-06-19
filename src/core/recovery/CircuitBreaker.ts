class CircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private isOpen = false;
  private cooldownMs = 5000;
  private lastFailureTime = 0;

  constructor(threshold = 5, cooldownMs = 5000) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      if (Date.now() - this.lastFailureTime > this.cooldownMs) {
        this.isOpen = false;
        this.failures = 0;
      } else {
        throw new Error("Circuit Open");
      }
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (e) {
      this.failures++;
      this.lastFailureTime = Date.now();
      if (this.failures >= this.threshold) {
        this.isOpen = true;
      }
      throw e;
    }
  }

  getFailures() {
    return this.failures;
  }

  getIsOpen() {
    return this.isOpen;
  }

  reset() {
    this.failures = 0;
    this.isOpen = false;
  }
}

export default CircuitBreaker;
