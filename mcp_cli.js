const { spawnSync } = require('child_process');
const tool = process.argv[2];
const jsonArgs = process.argv[3];
const result = spawnSync('node', ['nexus_bridge.js', tool, jsonArgs], { stdio: 'inherit' });
if (result.error) console.error(result.error);
process.exit(result.status || 0);
