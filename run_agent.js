const { spawnSync } = require('child_process');

const args = {
    prompt: "Act as an expert game developer swarm. Build a complete, bug-free Sudoku game using React and Tailwind in C:\\tools\\workspace\\calc\\Chess_Engine. Ensure strict state segregation between the immutable board solution and the user's current input state.",
    subagent_type: "react-surgeon"
};

const result = spawnSync('node', ['nexus_bridge.js', 'Agent', JSON.stringify(args)], { stdio: 'inherit' });
if(result.error) console.error(result.error);
