// src/dashboard.js
// Simple SRE‑style dashboard for monitoring ChessEngine services.
// Displays server status, active workers, and recent logs.

class Dashboard {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = `
      <h2>ChessEngine SRE Dashboard</h2>
      <div id="status">Status: <span class="value">Loading…</span></div>
      <div id="workers">Workers: <span class="value">0</span></div>
      <div id="logs"><pre class="log-output"></pre></div>
    `;
    this.statusEl = this.container.querySelector('#status .value');
    this.workersEl = this.container.querySelector('#workers .value');
    this.logEl = this.container.querySelector('#logs .log-output');
  }

  // Update the status text (e.g., "OK", "Degraded", "Down").
  setStatus(text) {
    this.statusEl.textContent = text;
    this.statusEl.style.color = text === 'OK' ? 'lightgreen' : text === 'Degraded' ? 'orange' : 'red';
  }

  // Update the number of active worker processes.
  setWorkers(count) {
    this.workersEl.textContent = count;
  }

  // Append a new log line to the output area.
  addLog(line) {
    const timestamp = new Date().toISOString();
    this.logEl.textContent += `[${timestamp}] ${line}\n`;
    // Auto‑scroll to bottom.
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  // Clear all logs.
  clearLogs() {
    this.logEl.textContent = '';
  }
}

module.exports = Dashboard;
