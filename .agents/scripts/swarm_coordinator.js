/**
 * 🟣 SwarmCoordinator — Sovereign Multi-Agent Coordinator for Aether Engine V11.0
 * Part of: Phase 2 — 85 → 92
 *
 * Usage: node swarm_coordinator.js --cmd=status|delegate|orchestrate
 * Coordinates multiple specialized agents for parallel task execution.
 */

const fs = require("fs");
const path = require("path");

const BRIDGE_PATH = path.join(
  __dirname,
  "..",
  "memory",
  "telepathy",
  "bridge.json",
);

// ─── Agent Definitions ─────────────────────────────────────

const AGENTS = {
  "django-doctor": {
    role: "Backend Specialist",
    skills: ["Django", "ORM", "Migrations", "DRF", "PostgreSQL"],
    priority: 1,
    status: "idle",
  },
  "react-surgeon": {
    role: "Frontend Specialist",
    skills: ["React", "Vite", "TailwindCSS", "RTL", "State Management"],
    priority: 1,
    status: "idle",
  },
  "flutter-fixer": {
    role: "Mobile Specialist",
    skills: ["Flutter", "Dart", "BLoC", "Provider"],
    priority: 2,
    status: "idle",
  },
  "db-forensics": {
    role: "Database Auditor",
    skills: ["SQL", "N+1 Detection", "Migration Conflicts", "Data Integrity"],
    priority: 1,
    status: "idle",
  },
  "security-audit": {
    role: "Security Sentinel",
    skills: ["Secrets Detection", "XSS", "SQL Injection", "CSRF", "JWT"],
    priority: 1,
    status: "idle",
  },
  "nexus-memory": {
    role: "Memory Keeper",
    skills: ["Pattern Storage", "Decision Logging", "Vector Indexing"],
    priority: 3,
    status: "idle",
  },
  "architectural-constitution": {
    role: "Architect",
    skills: ["Project Constitution", "Code Standards", "Design Patterns"],
    priority: 2,
    status: "idle",
  },
};

class SwarmCoordinator {
  constructor() {
    this.agents = JSON.parse(JSON.stringify(AGENTS));
    this.tasks = [];
    this.delegations = [];
    this.stats = {
      total_tasks: 0,
      completed: 0,
      failed: 0,
      parallel_batches: 0,
    };
  }

  // ─── Agent Management ───────────────────────────────────

  listAgents(filter = {}) {
    let agents = Object.entries(this.agents).map(([id, agent]) => ({
      id,
      ...agent,
    }));

    if (filter.status)
      agents = agents.filter((a) => a.status === filter.status);
    if (filter.skill)
      agents = agents.filter((a) => a.skills.includes(filter.skill));
    if (filter.minPriority)
      agents = agents.filter((a) => a.priority <= filter.minPriority);

    return agents;
  }

  getAgent(id) {
    return this.agents[id] ? { id, ...this.agents[id] } : null;
  }

  setAgentStatus(id, status) {
    if (this.agents[id]) {
      this.agents[id].status = status;
      return { success: true, id, status };
    }
    return { success: false, error: `Agent not found: ${id}` };
  }

  // ─── Task Management ────────────────────────────────────

  createTask(description, requiredSkills = [], priority = 1) {
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description,
      requiredSkills,
      priority,
      status: "pending",
      assignedTo: null,
      created: new Date().toISOString(),
      completed: null,
      result: null,
    };
    this.tasks.push(task);
    this.stats.total_tasks++;
    return task;
  }

  // ─── Intelligent Delegation ─────────────────────────────

  delegate(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: `Task not found: ${taskId}` };

    // Find best agent
    const available = Object.entries(this.agents)
      .filter(([id, agent]) => agent.status === "idle")
      .map(([id, agent]) => {
        const matchCount = task.requiredSkills.filter((s) =>
          agent.skills.includes(s),
        ).length;
        const matchPct =
          task.requiredSkills.length > 0
            ? matchCount / task.requiredSkills.length
            : 0.5;
        const priorityScore = (4 - agent.priority) / 4; // Lower priority number = higher score
        return {
          id,
          agent,
          matchCount,
          matchPct,
          score: matchPct * 0.7 + priorityScore * 0.3,
        };
      })
      .sort((a, b) => b.score - a.score);

    if (available.length === 0) {
      return { success: false, error: "No idle agents available", taskId };
    }

    const best = available[0];
    task.assignedTo = best.id;
    task.status = "assigned";
    this.agents[best.id].status = "busy";

    const delegation = {
      taskId: task.id,
      agentId: best.id,
      agentRole: best.agent.role,
      matchScore: Math.round(best.score * 100),
      assignedAt: new Date().toISOString(),
    };
    this.delegations.push(delegation);

    return { success: true, delegation, task };
  }

  // ─── Parallel Orchestration ─────────────────────────────

  orchestrate(tasks) {
    // Create all tasks
    const created = tasks.map((t) =>
      this.createTask(t.description, t.skills, t.priority || 1),
    );

    // Delegate in priority order
    const results = [];
    const pending = [...created].sort((a, b) => a.priority - b.priority);

    for (const task of pending) {
      const result = this.delegate(task.id);
      results.push(result);
      if (!result.success) {
        // Queue for later
        task.status = "queued";
      }
    }

    this.stats.parallel_batches++;

    return {
      batch_id: this.stats.parallel_batches,
      total: created.length,
      delegated: results.filter((r) => r.success).length,
      queued: results.filter((r) => !r.success).length,
      results,
    };
  }

  // ─── Task Completion ────────────────────────────────────

  completeTask(taskId, result = {}) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, error: `Task not found: ${taskId}` };

    task.status = result.success ? "completed" : "failed";
    task.completed = new Date().toISOString();
    task.result = result;

    if (task.assignedTo) {
      this.agents[task.assignedTo].status = "idle";
    }

    if (result.success) this.stats.completed++;
    else this.stats.failed++;

    // Auto-delegate queued tasks
    const queued = this.tasks.find((t) => t.status === "queued");
    if (queued) {
      const delegated = this.delegate(queued.id);
      return {
        completed: { taskId, status: task.status },
        auto_delegated: delegated,
      };
    }

    return { success: true, taskId, status: task.status };
  }

  // ─── Status Report ──────────────────────────────────────

  status() {
    return {
      agents: {
        total: Object.keys(this.agents).length,
        idle: Object.values(this.agents).filter((a) => a.status === "idle")
          .length,
        busy: Object.values(this.agents).filter((a) => a.status === "busy")
          .length,
        list: Object.entries(this.agents).map(([id, a]) => ({
          id,
          role: a.role,
          status: a.status,
          priority: a.priority,
        })),
      },
      tasks: {
        total: this.tasks.length,
        pending: this.tasks.filter((t) => t.status === "pending").length,
        assigned: this.tasks.filter((t) => t.status === "assigned").length,
        queued: this.tasks.filter((t) => t.status === "queued").length,
        completed: this.tasks.filter((t) => t.status === "completed").length,
        failed: this.tasks.filter((t) => t.status === "failed").length,
      },
      stats: this.stats,
      delegations: this.delegations.slice(-10),
    };
  }

  // ─── Bridge Sync ────────────────────────────────────────

  syncBridge() {
    try {
      if (fs.existsSync(BRIDGE_PATH)) {
        const bridge = JSON.parse(fs.readFileSync(BRIDGE_PATH, "utf-8"));
        bridge.swarm_status = {
          agents_idle: Object.values(this.agents).filter(
            (a) => a.status === "idle",
          ).length,
          agents_busy: Object.values(this.agents).filter(
            (a) => a.status === "busy",
          ).length,
          tasks_pending: this.tasks.filter(
            (t) => t.status === "pending" || t.status === "queued",
          ).length,
          last_orchestration: new Date().toISOString(),
        };
        fs.writeFileSync(BRIDGE_PATH, JSON.stringify(bridge, null, 2));
      }
    } catch (e) {
      /* non-critical */
    }
    return { synced: true };
  }
}

// ─── CLI ────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd =
    args.find((a) => a.startsWith("--cmd="))?.split("=")[1] || "status";

  const swarm = new SwarmCoordinator();

  switch (cmd) {
    case "status":
      console.log(JSON.stringify(swarm.status(), null, 2));
      break;

    case "agents":
      console.log(JSON.stringify(swarm.listAgents(), null, 2));
      break;

    case "orchestrate": {
      const tasks = [
        {
          description: "Build StateMachine service",
          skills: ["Django"],
          priority: 1,
        },
        {
          description: "Build PermissionCallbacks",
          skills: ["Django", "React"],
          priority: 1,
        },
        {
          description: "Build ContextCompressor",
          skills: ["React"],
          priority: 2,
        },
        {
          description: "Audit database integrity",
          skills: ["SQL", "PostgreSQL"],
          priority: 1,
        },
        { description: "Security scan", skills: ["Django"], priority: 2 },
        {
          description: "Build Flutter mobile UI",
          skills: ["Flutter", "Dart"],
          priority: 3,
        },
      ];
      const result = swarm.orchestrate(tasks);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "complete": {
      const taskId = args.find((a) => a.startsWith("--task="))?.split("=")[1];
      const success = args.includes("--fail") ? false : true;
      if (!taskId) {
        // Complete first assigned task
        const task = swarm.tasks.find((t) => t.status === "assigned");
        if (task) {
          console.log(
            JSON.stringify(
              swarm.completeTask(task.id, { success, output: "Done" }),
              null,
              2,
            ),
          );
        } else {
          console.log(JSON.stringify({ error: "No assigned tasks" }));
        }
      } else {
        console.log(
          JSON.stringify(
            swarm.completeTask(taskId, { success, output: "Done" }),
            null,
            2,
          ),
        );
      }
      break;
    }

    default:
      console.log(JSON.stringify(swarm.status(), null, 2));
  }
}

module.exports = { SwarmCoordinator, AGENTS };
