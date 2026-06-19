const fs = require('fs');
const path = require('path');

class BridgeLogger {
  constructor() {
    this.rootDir = path.join(__dirname, '..', '..');
    this.logDir = path.join(this.rootDir, '.nexus', 'var', 'telemetry');
    this.logFile = path.join(this.logDir, 'bridge_diagnostics.jsonl');
    
    // Ensure directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _writeLog(level, message, metadata = {}) {
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        ...metadata
      };
      
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, logLine, 'utf8');
      
      // Also write to console for immediate visibility, matching MCP standard (stderr for errors to avoid breaking JSON-RPC)
      const formattedConsole = `[${level.toUpperCase()}] ${message}`;
      if (level === 'error' || level === 'critical') {
        console.error(`\x1b[31m${formattedConsole}\x1b[0m`);
      } else if (level === 'warn') {
        console.error(`\x1b[33m${formattedConsole}\x1b[0m`);
      } else {
        console.error(`\x1b[32m${formattedConsole}\x1b[0m`);
      }
    } catch (e) {
      // Fallback if logger itself fails
      console.error(`[LOGGER-CRITICAL] Failed to write log: ${e.message}`);
    }
  }

  info(message, metadata = {}) {
    this._writeLog('info', message, metadata);
  }

  warn(message, metadata = {}) {
    this._writeLog('warn', message, metadata);
  }

  error(message, errorOrMetadata = {}) {
    let metadata = {};
    if (errorOrMetadata instanceof Error) {
      metadata = {
        error: errorOrMetadata.message,
        stack: errorOrMetadata.stack
      };
    } else {
      metadata = errorOrMetadata;
    }
    this._writeLog('error', message, metadata);
  }

  critical(message, errorOrMetadata = {}) {
    let metadata = {};
    if (errorOrMetadata instanceof Error) {
      metadata = {
        error: errorOrMetadata.message,
        stack: errorOrMetadata.stack
      };
    } else {
      metadata = errorOrMetadata;
    }
    this._writeLog('critical', message, metadata);
  }
}

// Export a singleton instance
const logger = new BridgeLogger();
module.exports = logger;
