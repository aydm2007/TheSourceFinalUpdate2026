// MCTS (Monte Carlo Tree Search) Engine Integration
// ---------------------------------------------------
// This module provides a basic MCTS implementation that can be used
// by higher‑level agents to perform decision‑making based on simulation
// rollouts. The engine is deliberately lightweight and written in plain
// JavaScript so it can run both in Node.js environments and in the browser
// (via a script tag).

/**
 * Node representing a game state in the tree.
 * @typedef {Object} MCTSNode
 * @property {any} state            - The underlying game state.
 * @property {MCTSNode[]} children  - Child nodes.
 * @property {MCTSNode|null} parent - Parent node (null for root).
 * @property {number} visits        - Number of times this node has been visited.
 * @property {number} wins          - Number of wins from simulations.
 */

/**
 * Default UCT (Upper Confidence bound applied to Trees) constant.
 * @type {number}
 */
const EXPLORATION_CONSTANT = Math.sqrt(2);

/**
 * Perform a single MCTS iteration.
 * @param {MCTSNode} root - Root node of the search tree.
 * @param {function(any): MCTSNode[]} expandFn - Returns an array of child states for a given state.
 * @param {function(any): number} simulateFn - Runs a simulation from a state and returns a reward (1 = win, 0 = loss).
 * @param {function(any, any): boolean} isTerminalFn - Returns true if the state is terminal.
 */
function iterateMCTS(root, expandFn, simulateFn, isTerminalFn) {
  // 1️⃣ Selection – traverse the tree using UCT.
  let node = root;
  while (node.children.length > 0) {
    node = node.children.reduce((best, child) => {
      const uct = (child.wins / (child.visits || 1)) +
        EXPLORATION_CONSTANT * Math.sqrt(Math.log(node.visits + 1) / (child.visits || 1));
      return uct > best.uct ? { node: child, uct } : best;
    }, { node: null, uct: -Infinity }).node;
  }

  // 2️⃣ Expansion – if node is non‑terminal, expand it.
  if (!isTerminalFn(node.state)) {
    const childStates = expandFn(node.state);
    node.children = childStates.map(state => ({
      state,
      children: [],
      parent: node,
      visits: 0,
      wins: 0
    }));
    // Pick a random child for simulation.
    node = node.children[Math.floor(Math.random() * node.children.length)];
  }

  // 3️⃣ Simulation – run a random playout.
  let simulationState = node.state;
  while (!isTerminalFn(simulationState)) {
    const possible = expandFn(simulationState);
    simulationState = possible[Math.floor(Math.random() * possible.length)];
  }
  const reward = simulateFn(simulationState);

  // 4️⃣ Backpropagation – update statistics up the path.
  while (node) {
    node.visits += 1;
    node.wins += reward;
    node = node.parent;
  }
}

/**
 * Run MCTS for a given number of iterations and return the best child.
 * @param {any} rootState - Initial game state.
 * @param {number} iterations - Number of MCTS iterations.
 * @param {function(any): MCTSNode[]} expandFn
 * @param {function(any): number} simulateFn
 * @param {function(any, any): boolean} isTerminalFn
 * @returns {any} - The state of the most promising child.
 */
function runMCTS(rootState, iterations, expandFn, simulateFn, isTerminalFn) {
  const root = {
    state: rootState,
    children: [],
    parent: null,
    visits: 0,
    wins: 0
  };
  for (let i = 0; i < iterations; i++) {
    iterateMCTS(root, expandFn, simulateFn, isTerminalFn);
  }
  // Choose child with highest visit count.
  const bestChild = root.children.reduce((best, child) =>
    child.visits > (best?.visits || 0) ? child : best, null);
  return bestChild ? bestChild.state : null;
}

// Export for Node.js or attach to window for browser usage.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runMCTS };
} else {
  window.runMCTS = runMCTS;
}
