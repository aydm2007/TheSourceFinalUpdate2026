// Auto‑rollback helper – restores a file to its previous state using UndoChanges
// Usage: node auto_rollback.js <relative_path_to_file>
// Example: node auto_rollback.js src/rendering/calculations.js

const { execSync } = require('child_process');
const path = require('path');

function usage() {
  console.error('Usage: node auto_rollback.js <file_path>');
  process.exit(1);
}

if (process.argv.length !== 3) usage();

const targetPath = path.resolve(process.argv[2]);

try {
  // Call the sovereign UndoChanges tool via the bridge (MCP) using a shell command
  // The bridge registers the tool as `mcp_nexus-bridge_nexus_UndoChanges`
  const cmd = `mcp_nexus-bridge_nexus_UndoChanges --file_path "${targetPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`✅ Successfully rolled back ${targetPath}`);
} catch (err) {
  console.error('❌ Rollback failed:', err.message);
  process.exit(1);
}
