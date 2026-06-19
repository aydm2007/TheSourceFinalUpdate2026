const { executeTool } = require('../nexus_bridge.js');
const fs = require('fs');
const path = require('path');

async function runNexusBridgeAudit() {
    console.error("==================================================================");
    console.error("🛡️  NEXUS BRIDGE UNIFIED TOOLS & INTEGRATION AUDIT [SOVEREIGN V15]");
    console.error("==================================================================");

    const testCases = [
        {
            name: "OmegaDiagnostic",
            tool: "OmegaDiagnostic",
            args: {},
            validate: (res) => res.includes("ZERO_EXIT_CONFIRMED") && res.includes("KAIROS")
        },
        {
            name: "ZodSchema",
            tool: "ZodSchema",
            args: {},
            validate: (res) => res.includes("ToolArgsSchema") || res.includes("AuditEntrySchema")
        },
        {
            name: "TaskList",
            tool: "TaskList",
            args: {},
            validate: (res) => res.includes("Checklist")
        },
        {
            name: "Glob Search",
            tool: "Glob",
            args: { pattern: "*.js", path: "scripts" },
            validate: (res) => res.includes("auto_distill_memory.js") || res.includes("pre_commit_secrets_shield.js")
        },
        {
            name: "Grep Code Search",
            tool: "Grep",
            args: { pattern: "OmegaDiagnostic", path: "nexus_bridge.js" },
            validate: (res) => res.includes("nexus_bridge.js")
        },
        {
            name: "FileRead (package.json)",
            tool: "FileRead",
            args: { file_path: "package.json", limit: 50 },
            validate: (res) => res.includes("name") && res.includes("version")
        },
        {
            name: "ServerMode Status",
            tool: "ServerMode",
            args: { action: "status" },
            validate: (res) => res.includes("Active Servers")
        },
        {
            name: "VisualAuditReport",
            tool: "VisualAuditReport",
            args: { report_name: "nexus_bridge_live_run" },
            validate: (res) => res.includes("successfully generated")
        }
    ];

    let passed = 0;
    const auditReport = [];

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        console.error(`\n[Test ${i+1}/${testCases.length}] Testing tool: ${tc.name}...`);
        try {
            const startTime = Date.now();
            const result = await executeTool(tc.tool, tc.args);
            const duration = Date.now() - startTime;
            
            const isOK = tc.validate(result);
            if (isOK) {
                console.error(`✅ Passed (${duration}ms)`);
                passed++;
                auditReport.push({ name: tc.name, status: "PASS", duration: `${duration}ms`, details: "Valid schema & output signature matches." });
            } else {
                console.error(`❌ Failed validation. Output sample: ${result.substring(0, 150)}`);
                auditReport.push({ name: tc.name, status: "FAIL", duration: `${duration}ms`, details: `Signature mismatch. Output: ${result.substring(0, 80)}` });
            }
        } catch (error) {
            console.error(`❌ Failed with exception: ${error.message}`);
            auditReport.push({ name: tc.name, status: "ERROR", duration: "0ms", details: error.message });
        }
    }

    const score = Math.round((passed / testCases.length) * 100);
    console.error("\n==================================================================");
    console.error(`📊 CONSOLIDATED AUDIT RESULTS: ${passed}/${testCases.length} Passed`);
    console.error(`🎯 ATOMIC RATING: ${score}/100`);
    console.error("==================================================================");

    const reportData = {
        timestamp: new Date().toISOString(),
        score: score,
        passed: passed,
        total: testCases.length,
        report: auditReport
    };

    fs.mkdirSync(path.join(__dirname, '..', 'scratch'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'nexus_bridge_audit_report.json'), JSON.stringify(reportData, null, 2), 'utf8');
    console.error("Saved detailed JSON report to scratch/nexus_bridge_audit_report.json");
    
    if (score < 100) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runNexusBridgeAudit().catch(err => {
    console.error("Critical failure during audit script execution:", err);
    process.exit(1);
});
