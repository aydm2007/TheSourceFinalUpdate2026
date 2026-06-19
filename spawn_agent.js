const { spawnSync } = require('child_process');
const payload = JSON.stringify({
  subagent_type: 'react-surgeon',
  description: 'Swarm Leader',
  prompt: 'Act as an expert game developer swarm. Build a complete, bug-free Sudoku game using React and Tailwind. Features: Automated board generation with a guaranteed valid unique solution, 3 difficulty levels, cell conflict highlighting, move history (Undo/Redo), and an automated solver using backtracking. Ensure strict state segregation between the immutable board solution and the user input state. Work strictly in C:\\tools\\workspace\\calc\\Chess_Engine'
});
spawnSync('node', ['nexus_bridge.js', 'Agent', payload], { stdio: 'inherit' });
