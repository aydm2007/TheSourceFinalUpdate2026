/**
 * 📊 LogManager — Sovereign Log Curation & Behavior Audit
 * Handles rotation, compaction, error extraction, and behavior pattern analysis.
 */
const fs = require('fs');
const path = require('path');

class LogManager {
  constructor(bridgeRoot) {
    this.bridgeRoot = bridgeRoot;
    this.ledgerPath = path.join(bridgeRoot, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
    this.legacyLedgerPath = path.join(bridgeRoot, 'shadow_ledger.jsonl');
  }

  /**
   * Rotates log files to prevent size bloat (e.g. max 5000 lines)
   * @param {number} maxLines 
   */
  rotateLogs(maxLines = 5000) {
    const targetPaths = [this.ledgerPath, this.legacyLedgerPath];
    const report = [];

    for (const filePath of targetPaths) {
      if (!fs.existsSync(filePath)) continue;

      try {
        const stats = fs.statSync(filePath);
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n').filter(l => l.trim().length > 0);

        if (lines.length > maxLines) {
          const keepLines = lines.slice(-maxLines);
          const backupLines = lines.slice(0, lines.length - maxLines);

          const backupPath = `${filePath}.bak`;
          
          // Append older lines to backup file
          fs.appendFileSync(backupPath, backupLines.join('\n') + '\n');
          // Overwrite active file with truncated lines
          fs.writeFileSync(filePath, keepLines.join('\n') + '\n');

          report.push({
            file: path.basename(filePath),
            status: 'ROTATED',
            originalLines: lines.length,
            archivedLines: backupLines.length,
            keptLines: keepLines.length,
            originalSize: stats.size,
            newSize: fs.statSync(filePath).size
          });
        } else {
          report.push({
            file: path.basename(filePath),
            status: 'HEALTHY',
            lines: lines.length,
            size: stats.size
          });
        }
      } catch (e) {
        report.push({
          file: path.basename(filePath),
          status: 'ERROR',
          error: e.message
        });
      }
    }

    return report;
  }

  /**
   * Extracts errors, warnings, and calculates failure rates from active logs
   * @param {number} scanDepth limit N latest entries
   */
  analyzeBehavior(scanDepth = 500) {
    const filePath = fs.existsSync(this.ledgerPath) ? this.ledgerPath : this.legacyLedgerPath;
    if (!fs.existsSync(filePath)) {
      return { status: 'NO_LOGS_FOUND' };
    }

    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const lines = data.split('\n').filter(l => l.trim().length > 0);
      const targetLines = lines.slice(-scanDepth);

      let successCount = 0;
      let failureCount = 0;
      let securityBreachCount = 0;
      const toolFailures = {};
      const errorsList = [];

      for (const line of targetLines) {
        try {
          const entry = JSON.parse(line);
          const isFailed = entry.status === 'FAILED' || entry.allowed === false || entry.type?.includes('reject') || entry.error;

          if (isFailed) {
            failureCount++;
            const action = entry.action || entry.tool || 'UNKNOWN';
            toolFailures[action] = (toolFailures[action] || 0) + 1;
            
            errorsList.push({
              timestamp: entry.timestamp || new Date().toISOString(),
              tool: action,
              error: entry.error || entry.reason || 'Unauthorized / Rejected'
            });
          } else {
            successCount++;
          }

          if (entry.reason?.includes('SOVEREIGN BREACH') || entry.type?.includes('breach')) {
            securityBreachCount++;
          }
        } catch (e) {
          // Unparseable or unstructured legacy format line
          if (line.toLowerCase().includes('fail') || line.toLowerCase().includes('error')) {
            failureCount++;
            errorsList.push({
              timestamp: new Date().toISOString(),
              tool: 'legacy_text_log',
              error: line.substring(0, 150)
            });
          } else {
            successCount++;
          }
        }
      }

      const total = successCount + failureCount;
      const failureRate = total > 0 ? ((failureCount / total) * 100).toFixed(2) : '0.00';

      return {
        status: 'ANALYZED',
        totalProcessed: total,
        successCount,
        failureCount,
        securityBreachCount,
        failureRatePercent: `${failureRate}%`,
        frequentFailingTools: toolFailures,
        recentErrors: errorsList.slice(-10) // last 10 errors
      };
    } catch (e) {
      return { status: 'ERROR', error: e.message };
    }
  }
}

module.exports = LogManager;
