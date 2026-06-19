import registry, { RuntimeNode } from "./NodeRegistry";

export class ClusterManager {
  allocateTask(task: any): RuntimeNode | undefined {
    const nodes = registry.getHealthyNodes();
    if (nodes.length === 0) {
      return undefined;
    }
    // Sort nodes by load ascending, pick the least loaded one
    const sorted = [...nodes].sort((a, b) => a.load - b.load);
    return sorted[0];
  }
}

export default new ClusterManager();
