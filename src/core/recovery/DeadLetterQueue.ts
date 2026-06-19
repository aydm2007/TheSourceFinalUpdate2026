class DeadLetterQueue {
  private failed: any[] = [];

  push(job: any) {
    this.failed.push(job);
  }

  retry() {
    return this.failed.shift();
  }

  retryAll() {
    const list = [...this.failed];
    this.failed = [];
    return list;
  }

  getFailed() {
    return this.failed;
  }

  size() {
    return this.failed.length;
  }

  clear() {
    this.failed = [];
  }
}

export default new DeadLetterQueue();
