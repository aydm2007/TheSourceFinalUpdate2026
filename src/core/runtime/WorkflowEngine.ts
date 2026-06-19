export interface TaskNode {
  id: string;
  deps: string[];
  execute(): Promise<any>;
}

export class WorkflowEngine {
  async run(tasks: TaskNode[]) {
    const completed = new Set<string>();
    const running = new Set<string>();

    while (completed.size < tasks.length) {
      let progressMade = false;

      for (const task of tasks) {
        if (completed.has(task.id) || running.has(task.id)) {
          continue;
        }

        const ready = task.deps.every((d) => completed.has(d));
        if (ready) {
          running.add(task.id);
          // Execute tasks concurrently or sequentially depending on engine model,
          // here we do basic sequential execution for predictable consensus/governance.
          try {
            await task.execute();
            completed.add(task.id);
            progressMade = true;
          } finally {
            running.delete(task.id);
          }
        }
      }

      if (!progressMade && completed.size < tasks.length) {
        throw new Error("Deadlock detected in TaskGraph or all remaining tasks failed!");
      }
    }
  }
}
