import * as fs from 'fs';
import * as path from 'path';
import { SemanticLockManager, LockType } from './SemanticLockManager';

/**
 * EvolutionReplicator (Level 6 Autonomy)
 * 
 * This engine allows the Swarm to dynamically propose, synthesize, and 
 * inject new Tools (TypeScript) and Skills (Markdown) into the active ecosystem.
 * It is protected by the SemanticLockManager to prevent concurrent mutations.
 */
export class EvolutionReplicator {
    private lockManager: SemanticLockManager;
    private toolsDir: string;
    private skillsDir: string;

    constructor(
        lockManager: SemanticLockManager, 
        workspaceRoot: string, 
        targetProjectRoot: string
    ) {
        this.lockManager = lockManager;
        this.toolsDir = path.join(workspaceRoot, 'src', 'tools');
        this.skillsDir = path.join(targetProjectRoot, '.agent', 'skills');
    }

    /**
     * Proposes a new MCP Tool to be dynamically injected into TheSource.
     */
    public async injectNewTool(toolName: string, sourceCode: string, agentId: string): Promise<string> {
        const resourceId = `evolution:tool:${toolName}`;
        
        // Secure the Evolutionary Forge
        if (!this.lockManager.acquireLock(resourceId, agentId, LockType.EXCLUSIVE)) {
            throw new Error(`Evolution Error: Another agent is currently modifying the tool [${toolName}]`);
        }

        try {
            const toolDirPath = path.join(this.toolsDir, toolName);
            if (!fs.existsSync(toolDirPath)) {
                fs.mkdirSync(toolDirPath, { recursive: true });
            }

            const filePath = path.join(toolDirPath, `${toolName}.ts`);
            fs.writeFileSync(filePath, sourceCode, 'utf8');

            return `[Evolution Success] Tool ${toolName} has been injected successfully. The Swarm must reload the Nexus registry to utilize it.`;
        } finally {
            this.lockManager.releaseLock(resourceId, agentId);
        }
    }

    /**
     * Proposes a new Skill (Doctrine) to be injected into the target project (AgriAsset).
     */
    public async synthesizeSkill(skillName: string, markdownContent: string, agentId: string): Promise<string> {
        const resourceId = `evolution:skill:${skillName}`;

        if (!this.lockManager.acquireLock(resourceId, agentId, LockType.EXCLUSIVE)) {
            throw new Error(`Evolution Error: Skill synthesis for [${skillName}] is blocked by another agent.`);
        }

        try {
            const skillDirPath = path.join(this.skillsDir, skillName);
            if (!fs.existsSync(skillDirPath)) {
                fs.mkdirSync(skillDirPath, { recursive: true });
            }

            const filePath = path.join(skillDirPath, 'SKILL.md');
            fs.writeFileSync(filePath, markdownContent, 'utf8');

            return `[Evolution Success] Skill doctrine [${skillName}] synthesized. Swarm agents can now adopt this skill.`;
        } finally {
            this.lockManager.releaseLock(resourceId, agentId);
        }
    }
}
