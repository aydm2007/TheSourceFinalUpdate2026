/*
 * retryHelper.js – Utility for wrapping asynchronous agent executions with retry logic.
 * Each retry uses exponential back‑off: 1s, 2s, 4s.
 * Errors are logged to shadow_ledger.jsonl for forensic traceability.
 */
const fs = require('fs');
const path = require('path');
// Resolve shadow ledger path relative to the project root
const SHADOW_LEDGER = path.resolve(process.cwd(), 'shadow_ledger.jsonl');

/**
 * Append a JSON line to the shadow ledger.
 * @param {Object} entry
 */
function logToLedger(entry) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(SHADOW_LEDGER, line, { encoding: 'utf8' });
}

/**
 * Wrap a function with retry logic.
 * @param {Function} fn - async function returning a Promise.
 * @param {string} agentName - identifier for logging.
 * @returns {Promise<any>}
 */
async function withRetry(fn, agentName) {
  const maxAttempts = 3;
  const delays = [1000, 2000, 4000]; // milliseconds
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logToLedger({ type: 'agent_start', agent: agentName, attempt });
      const result = await fn();
      logToLedger({ type: 'agent_success', agent: agentName, attempt });
      return result;
    } catch (err) {
      logToLedger({ type: 'agent_error', agent: agentName, attempt, error: err.message });
      if (attempt === maxAttempts) throw err;
      // exponential back‑off
      await new Promise(res => setTimeout(res, delays[attempt - 1]));
    }
  }
}

module.exports = { withRetry, logToLedger };