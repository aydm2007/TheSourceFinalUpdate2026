// workers/worker.js
const { parentPort, workerData } = require('worker_threads');
const fetch = require('node-fetch'); // internet access (restricted)
const { loadSkill, invokeTool } = require('../core/bridge/api'); // MCP Bridge API (placeholder)
const { logToLedger } = require('../utils/shadowLedger');

/**
 * Execute a task received from the manager.
 * task = { id, tool, args, skill? }
 */
async function executeTask(task) {
  try {
    if (task.skill) {
      // Load the requested skill before invoking the tool
      await loadSkill(task.skill);
    }
    const result = await invokeTool(task.tool, task.args);
    logToLedger('task_success', { taskId: task.id, result });
    return result;
  } catch (err) {
    logToLedger('task_error', { taskId: task.id, error: err.message });
    throw err;
  }
}

parentPort.on('message', async (msg) => {
  if (msg.cmd === 'run') {
    try {
      const res = await executeTask(msg.payload);
      parentPort.postMessage({ status: 'done', result: res });
    } catch (e) {
      parentPort.postMessage({ status: 'error', error: e.message });
    }
  }
});
