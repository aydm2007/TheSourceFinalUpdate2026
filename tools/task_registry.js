// Task Registry – records every AsyncBackgroundJob
// Usage: require('./task_registry')
const fs = require('fs');
const path = require('path');
const ledgerPath = path.resolve(process.cwd(), 'shadow_ledger.jsonl');

class TaskRegistry {
  constructor() {
    this.tasks = new Map(); // pid -> {cmd, logFile, status}
  }
  add(pid, cmd, logFile) {
    this.tasks.set(pid, { cmd, logFile, status: 'running', start: Date.now() });
    this._log('ADD', pid, cmd, logFile);
  }
  update(pid, status) {
    const t = this.tasks.get(pid);
    if (t) { t.status = status; this._log('UPDATE', pid, status); }
  }
  remove(pid) {
    const t = this.tasks.get(pid);
    if (t) { this._log('REMOVE', pid, t.status); this.tasks.delete(pid); }
  }
  _log(action, pid, ...rest) {
    const line = JSON.stringify({ ts: Date.now(), action, pid, details: rest }) + '\n';
    fs.appendFileSync(ledgerPath, line);
  }
  list() { return Array.from(this.tasks.entries()).map(([pid, info]) => ({ pid, ...info })); }
}
module.exports = new TaskRegistry();
