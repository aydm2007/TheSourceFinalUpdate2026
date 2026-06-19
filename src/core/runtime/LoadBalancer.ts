export interface WorkerNode {
  id: string;
  load: number;
}

class LoadBalancer {
  select(nodes: WorkerNode[]): WorkerNode | undefined {
    if (nodes.length === 0) return undefined;
    return [...nodes].sort((a, b) => a.load - b.load)[0];
  }
}

export default new LoadBalancer();
