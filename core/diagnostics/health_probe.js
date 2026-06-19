/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  🏥 HealthProbe (V3 Sentinel Diagnostics)                  │
 * │  Ensures system integrity before MCP Server boot.          │
 * │  Checks dependencies, binary paths, memory ledger access.  │
 * └─────────────────────────────────────────────────────────────┘
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HealthProbe {
    constructor(bridgeRoot) {
        this.bridgeRoot = bridgeRoot;
        this.status = {
            healthy: true,
            checks: {}
        };
    }

    runChecks() {
        this._checkShadowLedger();
        this._checkBinaries();
        this._checkDatabase();
        this._runLogManagement();
        return this.status;
    }

    _checkShadowLedger() {
        const ledgerPath = path.join(this.bridgeRoot, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
        try {
            if (!fs.existsSync(ledgerPath)) {
                fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
                fs.writeFileSync(ledgerPath, '');
            }
            fs.accessSync(ledgerPath, fs.constants.R_OK | fs.constants.W_OK);
            this.status.checks.shadowLedger = 'PASS';
            this.status.checks.shadowLedgerPath = ledgerPath;
        } catch (e) {
            this.status.healthy = false;
            this.status.checks.shadowLedger = `FAIL - ${e.message}`;
        }
    }

    _checkBinaries() {
        try {
            const rgPath = require('@vscode/ripgrep').rgPath;
            if (!fs.existsSync(rgPath)) throw new Error('Ripgrep binary not found at ' + rgPath);
            this.status.checks.ripgrep = 'PASS';
        } catch (e) {
            this.status.healthy = false;
            this.status.checks.ripgrep = `FAIL - ${e.message}`;
        }
    }

    _checkDatabase() {
        const dbPath = path.join(this.bridgeRoot, 'config', 'database.db');
        try {
            if (!fs.existsSync(dbPath)) {
                throw new Error('Database not found at ' + dbPath);
            }
            fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
            this.status.checks.database = 'PASS';
            this.status.checks.databasePath = dbPath;
        } catch (e) {
            this.status.healthy = false;
            this.status.checks.database = `FAIL - ${e.message}`;
        }
    }

    _runLogManagement() {
        try {
            const LogManager = require('./log_manager.js');
            const manager = new LogManager(this.bridgeRoot);
            
            // Auto rotate logs if they exceed 5000 lines
            const rotationReport = manager.rotateLogs(5000);
            const analysis = manager.analyzeBehavior(500);

            this.status.checks.logManagement = {
                status: 'PASS',
                rotation: rotationReport,
                analysis: analysis
            };
        } catch (e) {
            this.status.checks.logManagement = {
                status: 'ERROR',
                message: e.message
            };
        }
    }
}

module.exports = HealthProbe;
