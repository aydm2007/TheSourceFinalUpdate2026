/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  💯 SelfScorer (V3 Readiness Engine)                       │
 * │  Calculates a dynamic 0-100 score of the MCP system        │
 * │  based on tool coverage, telemetry health, and diagnostics.│
 * └─────────────────────────────────────────────────────────────┘
 */
const fs = require('fs');

class SelfScorer {
    constructor(healthStatus, toolCount) {
        this.healthStatus = healthStatus;
        this.toolCount = toolCount || 0;
        this.score = 0;
        this.metrics = {};
    }

    calculateScore() {
        let baseScore = 100;
        
        // Metric 1: Health Probe (30 points)
        if (!this.healthStatus.healthy) {
            baseScore -= 30;
            this.metrics.health = 'FAILED (-30)';
        } else {
            this.metrics.health = 'PASS (30/30)';
        }

        // Metric 2: Tool Coverage (40 points)
        // Expecting 105 tools.
        const expectedTools = 105;
        if (this.toolCount < expectedTools) {
            const penalty = Math.min(40, (expectedTools - this.toolCount) * 2);
            baseScore -= penalty;
            this.metrics.tools = `PARTIAL - ${this.toolCount}/${expectedTools} (-${penalty})`;
        } else {
            this.metrics.tools = `FULL - ${this.toolCount}+ Tools (40/40)`;
        }

        // Metric 3: Validator Presence (30 points)
        try {
            require.resolve('../middleware/tool_arg_validator.js');
            this.metrics.validator = 'ACTIVE (30/30)';
        } catch (e) {
            baseScore -= 30;
            this.metrics.validator = 'MISSING (-30)';
        }

        this.score = Math.max(0, baseScore);
        return {
            totalScore: this.score,
            metrics: this.metrics,
            isProductionReady: this.score >= 95
        };
    }
}

module.exports = SelfScorer;
