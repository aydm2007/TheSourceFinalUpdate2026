const path = require('path');
const fs = require('fs');
const os = require('os');

function getNexusConfigHomeDir() {
  return process.env.NEXUS_CONFIG_DIR || path.join(os.homedir(), '.nexus');
}

function getMemoryBaseDir() {
  return process.env.NEXUS_ENGINE_REMOTE_MEMORY_DIR || getNexusConfigHomeDir();
}

/**
 * Resolves the telemetry directories and files based on active scope.
 * Supported scopes:
 * - 'project' (default): Persistent logs stored inside the project workspace under .nexus/var/telemetry/
 * - 'user': Persistent logs stored inside the user's home config directory under ~/.nexus/var/telemetry/
 */
function getTelemetryPaths(scope = 'project') {
  const activeScope = process.env.AETHER_TELEMETRY_SCOPE || scope;
  let baseDir;
  
  if (activeScope === 'user') {
    baseDir = path.join(getMemoryBaseDir(), 'var', 'telemetry');
  } else {
    // default to project scope
    baseDir = path.join(process.cwd(), '.nexus', 'var', 'telemetry');
  }
  
  // Ensure the directory exists
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  const sandboxSessionDir = path.join(baseDir, 'sandbox');
  if (!fs.existsSync(sandboxSessionDir)) {
    fs.mkdirSync(sandboxSessionDir, { recursive: true });
  }
  
  return {
    baseDir,
    shadowLedgerPath: path.join(baseDir, 'shadow_ledger.jsonl'),
    agentContextStorePath: path.join(baseDir, 'agent_context_store.json'),
    sandboxSessionDir
  };
}

module.exports = {
  getTelemetryPaths
};
