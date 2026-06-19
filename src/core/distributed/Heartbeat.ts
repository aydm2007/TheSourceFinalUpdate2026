export class Heartbeat {
  private status = new Map<string, number>();

  ping(nodeId: string) {
    this.status.set(nodeId, Date.now());
  }

  isAlive(nodeId: string, gracePeriodMs: number = 5000): boolean {
    const last = this.status.get(nodeId);
    if (!last) return false;
    return (Date.now() - last) < gracePeriodMs;
  }

  clear() {
    this.status.clear();
  }
}

export default new Heartbeat();
