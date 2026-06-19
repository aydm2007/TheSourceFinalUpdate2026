const path = require('path');
const dbManager = require('../db/db_manager.js');

class MultiProjectManager {
  async getProject(projectId) {
    try {
      return await dbManager.getProjectById(projectId);
    } catch (e) {
      console.error(`[MultiProject] Error fetching project by id: ${e.message}`);
      return null;
    }
  }

  isPathSafeForProject(projectPath, filePath) {
    if (!projectPath) return false;
    const resolvedPath = path.resolve(projectPath, filePath);
    const relative = path.relative(projectPath, resolvedPath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  }

  getProjectLedgerPath(projectId, projectPath) {
    const workdir = projectPath || path.resolve(process.cwd());
    return path.join(workdir, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
  }
}

const { orchestratorMiddleware } = require('../../orchestrator/middleware');

module.exports = new MultiProjectManager();

// Helper to apply the Orchestrator middleware to an Express‑style request pipeline
// Usage example (if the project uses Express or a similar router):
//   const app = express();
//   app.use(orchestratorMiddleware);
//   // then register the bridge handlers
// This ensures every incoming request passes through the policy checks and
// publishes events to the Redis `mcp:messages` channel.

