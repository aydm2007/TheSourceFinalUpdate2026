import queue from "./QueueManager";

class WorkerPool {
  private active = true;

  async run(worker: any) {
    this.active = true;
    while (this.active) {
      const task = queue.dequeue();
      if (!task) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }
      try {
        await worker.execute(task);
      } catch (err) {
        console.error(`Worker failed to execute task ${task.id}:`, err);
      }
    }
  }

  stop() {
    this.active = false;
  }
}

export default WorkerPool;
