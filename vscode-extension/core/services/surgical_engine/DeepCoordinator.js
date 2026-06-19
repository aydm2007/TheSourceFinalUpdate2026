/**
 * DeepCoordinator — Sovereign Sigma V16.0
 * ------------------------------------------
 * المنسق الفائق المسؤول عن إدارة دورة حياة المهمة وتنسيق الأسراب.
 */
const fs = require('fs');
const path = require('path');
const JSSurgicalEngine = require('./js_surgeon.js');
const ForensicReasoner = require('./ForensicReasoner.js');
const { execSync } = require('child_process');

class DeepCoordinator {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.jsEngine = new JSSurgicalEngine(workspaceRoot);
    this.reasoner = new ForensicReasoner(workspaceRoot);
    this.ledgerPath = path.join(workspaceRoot, 'shadow_ledger.jsonl');
    this.bugsPath = path.join(workspaceRoot, '.agents/memory/bugs.md');
  }

  logToLedger(entry) {
    const logLine = JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n';
    fs.appendFileSync(this.ledgerPath, logLine);
  }

  async coordinateTask(taskGoal, targetFile, className, methodName, newBody) {
    console.log(`[DeepCoordinator] Orchestrating: ${taskGoal}`);
    
    // 1. Deep Reasoning & Intent Validation (Superior to Opus 4.6)
    const reason = this.reasoner.analyzeIntent(taskGoal, targetFile);
    console.log(`-> Reasoning Status: ${reason.status}`);
    reason.reasoningChain.forEach(step => console.log(`   [CoT] ${step}`));

    if (reason.status === "REJECTED") {
        console.error("❌ Task Vetoed by Forensic Reasoner: Constitutional Violation.");
        return { status: "REJECTED", reason: reason.insights.join("; ") };
    }

    // 2. Discovery & Bug Check

    const ext = path.extname(targetFile);
    let simulationResult;

    // 2. Surgical Simulation
    if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
        this.jsEngine.loadToSandbox(targetFile);
        const patch = this.jsEngine.simulateMethodPatch(targetFile, className, methodName, newBody);
        if (!patch.success) return { status: "FAILED", reason: patch.message };
        simulationResult = this.jsEngine.calculateBlastRadius(targetFile);
    } else if (ext === '.py') {
        // Call Python Engine
        try {
            const cmd = `python "${path.join(__dirname, 'py_surgeon.py')}" "${targetFile}" "${className}" "${methodName}" "${newBody.replace(/"/g, '\\"')}"`;
            const output = execSync(cmd).toString();
            simulationResult = JSON.parse(output).blast;
        } catch (e) {
            return { status: "FAILED", reason: "Python Surgeon failure: " + e.message };
        }
    }

    // 3. Risk Management
    if (simulationResult && simulationResult.riskScore > 0.8) {
        this.logToLedger({ taskGoal, targetFile, status: "BLOCKED", risk: simulationResult.riskScore });
        return { status: "BLOCKED", risk: simulationResult.riskScore, nodes: simulationResult.affectedNodes };
    }

    // 4. Execution Approval
    const signature = require('crypto').createHash('sha256').update(taskGoal + Date.now()).digest('hex');
    this.logToLedger({ taskGoal, targetFile, status: "APPROVED", signature });

    return {
        status: "APPROVED",
        signature,
        blast: simulationResult
    };
  }
}

// CLI for agents
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 5) {
        console.log(JSON.stringify({ error: "Usage: node DeepCoordinator.js <goal> <file> <class> <method> <body>" }));
        process.exit(1);
    }
    const coordinator = new DeepCoordinator(process.cwd());
    coordinator.coordinateTask(args[0], args[1], args[2], args[3], args[4])
        .then(res => console.log(JSON.stringify(res, null, 2)))
        .catch(err => console.log(JSON.stringify({ status: "ERROR", message: err.message })));
}

module.exports = DeepCoordinator;
