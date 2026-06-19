export interface Task {
  type: string;
  [key: string]: any;
}

class ModelRouter {
  route(task: Task): string {
    if (task.type === "code") {
      return "gpt-coder";
    }
    if (task.type === "reasoning") {
      return "claude";
    }
    return "default";
  }
}

export default new ModelRouter();
