import fs from 'fs';
import path from 'path';

export interface Sector {
  agentId: string;
  startNode: number;
  endNode: number;
  totalNodesAssigned: number;
}

export class SourceMapSharder {
  private totalNodes: number = 0;
  private sectors: Sector[] = [];
  
  /**
   * Reads cli.js.map to determine the total number of SourceMap nodes.
   * Emulates parsing for this architecture.
   */
  public loadMap(mapFilePath: string): void {
    if (fs.existsSync(mapFilePath)) {
      try {
        const mapData = JSON.parse(fs.readFileSync(mapFilePath, 'utf8'));
        // If it's a standard V3 SourceMap, sources length defines the file chunks
        this.totalNodes = mapData.sources?.length || 4756; 
      } catch (e) {
        this.totalNodes = 4756; // Fallback Sovereign Value
      }
    } else {
      this.totalNodes = 4756; // Fallback
    }
  }

  /**
   * Calculates equitable distribution of nodes across a given number of agents.
   * @param totalAgents Number of agents participating in the sweep.
   */
  public calculateSectors(totalAgents: number): void {
    if (this.totalNodes === 0) throw new Error("SourceMap not loaded. Call loadMap() first.");
    
    this.sectors = [];
    const nodesPerAgent = Math.floor(this.totalNodes / totalAgents);
    const remainder = this.totalNodes % totalAgents;
    
    let currentStart = 1;

    for (let i = 0; i < totalAgents; i++) {
      // Give the remainder evenly to the first few agents
      const extraNode = i < remainder ? 1 : 0;
      const nodesAssigned = nodesPerAgent + extraNode;
      const endNode = currentStart + nodesAssigned - 1;

      this.sectors.push({
        agentId: `agent-${i + 1}`,
        startNode: currentStart,
        endNode: endNode,
        totalNodesAssigned: nodesAssigned
      });

      currentStart = endNode + 1;
    }
  }

  /**
   * Assigns a specific sector to an agent for zero-overlap execution.
   */
  public assignSector(agentId: string): Sector | null {
    const sector = this.sectors.find(s => s.agentId === agentId);
    return sector || null;
  }
  
  public getAllSectors(): Sector[] {
    return this.sectors;
  }
}

// Singleton for easy access by the Swarm
export const globalSourceMapSharder = new SourceMapSharder();
