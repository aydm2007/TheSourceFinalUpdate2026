export interface RuntimeNode {
  id: string;
  host: string;
  load: number;
  alive: boolean;
}

export class NodeRegistry {
  private nodes: RuntimeNode[] = [];

  register(node: RuntimeNode) {
    this.nodes.push(node);
  }

  getHealthyNodes(): RuntimeNode[] {
    return this.nodes.filter(n => n.alive);
  }

  clear() {
    this.nodes = [];
  }

  getAllNodes(): RuntimeNode[] {
    return this.nodes;
  }
}

export default new NodeRegistry();
