const { spawnSync } = require('child_process'); spawnSync('node', ['nexus_bridge.js', 'ParallelSwarmCoordinator', ''], { stdio: 'inherit' });
