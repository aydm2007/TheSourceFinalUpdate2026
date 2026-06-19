export type Job = {
  id: string;
  task: any;
};

class QueueManager {
  private queue: Job[] = [];

  enqueue(job: Job) {
    this.queue.push(job);
  }

  dequeue(): Job | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

export default new QueueManager();
