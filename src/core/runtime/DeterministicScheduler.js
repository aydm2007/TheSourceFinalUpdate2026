/**
 * @file DeterministicScheduler.js
 * @description المجدول الحتمي للمهام والأحداث (Deterministic Task Scheduler).
 */
const StateReducer = require("./StateReducer");
const AdmissionController = require("./AdmissionController");

class DeterministicScheduler {
  constructor(admissionController = new AdmissionController()) {
    this.eventLog = []; // Simulated Write-Ahead Log (WAL)
    this.state = this._getInitialState();
    this.queue = [];
    this.isProcessing = false;

    // Phase 2: Security & Idempotency
    this.admissionController = admissionController;
    this.processedEventIds = new Map(); // Simple LRU using Map's insertion order
    this.MAX_PROCESSED_EVENTS = 10000;
  }

  _getInitialState() {
    return {
      activeTasks: [],
      agents: {},
      metrics: {
        executions: 0,
        successes: 0,
        failures: 0,
      },
    };
  }

  /**
   * Enqueues an event for deterministic processing.
   * @param {import('./RuntimeEvent')} event
   */
  enqueue(event) {
    // 1. Admission Control (Request Shedding & Rate Limiting)
    if (this.admissionController.shouldReject(this.queue.length)) {
      throw new Error(
        "Sovereign Breach: Request Shedding triggered - Queue is full",
      );
    }
    if (!this.admissionController.consume(1)) {
      throw new Error("Sovereign Breach: Rate Limit Exceeded");
    }

    // 2. Idempotency Guard (Prevent Replay Storms)
    if (this.processedEventIds.has(event.id)) {
      console.warn(`🛡️ [Idempotency] Duplicate event dropped: ${event.id}`);
      return;
    }
    this._markProcessed(event.id);

    // 3. Queueing
    this.queue.push(event);
    this._processQueue();
  }

  _markProcessed(eventId) {
    this.processedEventIds.set(eventId, Date.now());
    // Prune oldest if we exceed capacity
    if (this.processedEventIds.size > this.MAX_PROCESSED_EVENTS) {
      const oldestKey = this.processedEventIds.keys().next().value;
      this.processedEventIds.delete(oldestKey);
    }
  }

  async _processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      this.eventLog.push(event);
      this.state = StateReducer.reduce(this.state, event);
    }

    this.isProcessing = false;
  }

  /**
   * Replays an event log from scratch to verify determinism.
   * @param {Array<import('./RuntimeEvent')>} log
   * @returns {Object} Reconstructed state
   */
  replay(log) {
    let rebuiltState = this._getInitialState();
    for (const event of log) {
      rebuiltState = StateReducer.reduce(rebuiltState, event);
    }
    return rebuiltState;
  }

  getCurrentState() {
    return this.state;
  }
}

module.exports = DeterministicScheduler;
