/**
 * @file StateReducer.js
 * @description محرك التحويلات الدقيقة (Immutable State Transitions).
 */

class StateReducer {
  /**
   * Applies an event to the current state immutably.
   * @param {Object} state - The current state object.
   * @param {import('./RuntimeEvent')} event - The runtime event to apply.
   * @returns {Object} A new state object representing the state after the event.
   */
  static reduce(state, event) {
    // Deep clone state to ensure true immutability (Pure JS implementation)
    const nextState = JSON.parse(JSON.stringify(state));

    switch (event.type) {
      case "TOOL_EXECUTION_START":
        nextState.activeTasks = nextState.activeTasks || [];
        nextState.activeTasks.push(event.payload.taskId);
        nextState.metrics.executions++;
        break;

      case "TOOL_EXECUTION_END":
        nextState.activeTasks = (nextState.activeTasks || []).filter(
          (id) => id !== event.payload.taskId,
        );
        if (event.payload.success) {
          nextState.metrics.successes++;
        } else {
          nextState.metrics.failures++;
        }
        break;

      case "AGENT_SPAWNED":
        nextState.agents = nextState.agents || {};
        nextState.agents[event.payload.agentId] = {
          status: "IDLE",
          spawnedAt: event.timestamp,
        };
        break;

      case "AGENT_TERMINATED":
        if (nextState.agents && nextState.agents[event.payload.agentId]) {
          delete nextState.agents[event.payload.agentId];
        }
        break;

      default:
        // By default, preserve state if event type is unknown
        break;
    }

    return nextState;
  }
}

module.exports = StateReducer;
