const fs = require('fs');
const path = require('path');

class TaskManager {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot || process.cwd();
        this.tasks = new Map(); // In-memory dependency matrix
        this.exportPath = path.join(this.workspaceRoot, '.nexus', 'sessions', 'task_matrix.md');
    }

    createTask(taskId, description, dependencies = []) {
        this.tasks.set(taskId, {
            id: taskId,
            description,
            dependencies,
            status: 'PENDING',
            assigned_to: null,
            logs: []
        });
        this.syncToMarkdown();
        return { status: 'CREATED', taskId };
    }

    assignTask(taskId, teamId) {
        if (!this.tasks.has(taskId)) return { status: 'NOT_FOUND', taskId };
        const task = this.tasks.get(taskId);
        task.assigned_to = teamId;
        task.status = 'IN_PROGRESS';
        task.logs.push(`Assigned to Team ${teamId} at ${new Date().toISOString()}`);
        this.syncToMarkdown();
        return { status: 'ASSIGNED', taskId, teamId };
    }

    updateTaskStatus(taskId, newStatus, logMessage) {
        if (!this.tasks.has(taskId)) return { status: 'NOT_FOUND', taskId };
        const task = this.tasks.get(taskId);
        task.status = newStatus;
        if (logMessage) task.logs.push(`[${newStatus}] ${logMessage} at ${new Date().toISOString()}`);
        this.syncToMarkdown();
        return { status: 'UPDATED', taskId, newStatus };
    }

    syncToMarkdown() {
        try {
            const dir = path.dirname(this.exportPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            let md = '# 🧠 Sovereign Dynamic Task Matrix (In-Memory Export)\n\n';
            md += '> **Auto-Generated:** Do not edit manually. Managed by `TaskManager.js`.\n\n';

            for (const [id, task] of this.tasks.entries()) {
                const icon = task.status === 'COMPLETED' ? '✅' : task.status === 'FAILED' ? '❌' : task.status === 'IN_PROGRESS' ? '🔄' : '⏳';
                md += `## ${icon} Task: ${id}\n`;
                md += `- **Description:** ${task.description}\n`;
                md += `- **Status:** \`${task.status}\`\n`;
                md += `- **Assigned Team:** ${task.assigned_to || 'None'}\n`;
                if (task.dependencies.length > 0) {
                    md += `- **Dependencies:** ${task.dependencies.join(', ')}\n`;
                }
                if (task.logs.length > 0) {
                    md += `- **Logs:**\n`;
                    task.logs.forEach(log => md += `  - ${log}\n`);
                }
                md += '\n';
            }

            fs.writeFileSync(this.exportPath, md, 'utf8');
        } catch (e) {
            console.error('[TaskManager] Failed to export matrix:', e.message);
        }
    }
}

module.exports = { TaskManager };
