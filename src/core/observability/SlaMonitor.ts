export interface SLO {
  availability: number;
  latency: number;
}

class SlaMonitor {
  private slo: SLO = { availability: 99.95, latency: 200 };
  private alerts: string[] = [];

  setSLO(slo: SLO) {
    this.slo = slo;
  }

  checkLatency(durationMs: number) {
    if (durationMs > this.slo.latency) {
      const msg = `SLA Latency Violation: Expected < ${this.slo.latency}ms, got ${durationMs}ms`;
      this.alerts.push(msg);
      console.warn(msg);
      return false;
    }
    return true;
  }

  getAlerts() {
    return this.alerts;
  }

  clear() {
    this.alerts = [];
  }
}

export default new SlaMonitor();
