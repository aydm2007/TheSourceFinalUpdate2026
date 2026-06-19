import { logForDebugging } from '../utils/debug.js';

export interface SkillNode {
  name: string;
  layer: 'diagnostic' | 'memory' | 'state' | 'planning' | 'execution';
  dependencies: string[];
  isConcurrencySafe: boolean;
}

export class SkillGraph {
  private graph: Map<string, SkillNode> = new Map();

  constructor() {
    this.initializeDefaultGraph();
  }

  private initializeDefaultGraph() {
    const defaultNodes: SkillNode[] = [
      { name: 'NexusOmegaDiagnostic', layer: 'diagnostic', dependencies: [], isConcurrencySafe: true },
      { name: 'NexusMemoryManager', layer: 'memory', dependencies: ['NexusOmegaDiagnostic'], isConcurrencySafe: true },
      { name: 'NexusStateManager', layer: 'state', dependencies: ['NexusMemoryManager'], isConcurrencySafe: false },
      { name: 'NexusAutoDream', layer: 'planning', dependencies: ['NexusStateManager'], isConcurrencySafe: true }
    ];

    for (const node of defaultNodes) {
      this.registerSkill(node);
    }
  }

  public registerSkill(node: SkillNode): void {
    this.graph.set(node.name, node);
    logForDebugging(`[SkillGraph] Registered Sovereign Skill Node: ${node.name} [Layer: ${node.layer}]`);
  }

  public getExecutionPlan(targetSkills: string[]): string[][] {
    const layers: string[][] = [];
    const visited = new Set<string>();

    let currentBatch = targetSkills.filter(skillName => {
      const node = this.graph.get(skillName);
      return node ? node.dependencies.length === 0 : true;
    });

    while (currentBatch.length > 0) {
      layers.push(currentBatch);
      currentBatch.forEach(s => visited.add(s));

      const nextBatch: string[] = [];
      for (const skillName of targetSkills) {
        if (visited.has(skillName)) continue;
        const node = this.graph.get(skillName);
        if (node && node.dependencies.every(dep => visited.has(dep))) {
          nextBatch.push(skillName);
        }
      }
      currentBatch = nextBatch;
    }

    return layers;
  }
}
