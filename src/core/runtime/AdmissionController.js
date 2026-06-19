/**
 * @file AdmissionController.js
 * @description نظام الحماية المتقدمة (Rate Limiting & Request Shedding)
 */

class AdmissionController {
  constructor(config = {}) {
    this.maxQueueLength = config.maxQueueLength || 1000;
    this.bucketCapacity = config.bucketCapacity || 100;
    this.tokenRefillRateMs = config.tokenRefillRateMs || 100;

    this.tokens = this.bucketCapacity;
    this.lastRefill = Date.now();
  }

  /**
   * خوارزمية Request Shedding: ترفض الطلب إذا كان الطابور ممتلئاً لتجنب انهيار الذاكرة.
   */
  shouldReject(currentQueueLength) {
    if (currentQueueLength >= this.maxQueueLength) {
      return true; // Shed the request
    }
    return false;
  }

  /**
   * خوارزمية Token Bucket: تتحكم في معدل تدفق الطلبات.
   */
  consume(tokensRequested = 1) {
    this._refill();
    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }
    return false; // Rate limit exceeded
  }

  _refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.tokenRefillRateMs);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.bucketCapacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

module.exports = AdmissionController;
