const { spawnSync } = require('child_process'); spawnSync('node', ['nexus_bridge.js', 'FileWrite', ''], { stdio: 'inherit' });
