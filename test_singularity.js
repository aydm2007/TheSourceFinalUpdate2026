const { SECURITY_TOOLS } = require('./core/security/tools_integrator.js');

async function runSingularityTests() {
    console.error("🌌 Testing HardwareAstMapper (IoT Bridge)...");
    const hwParams = { sensor_id: "agri-valve-01", firmware_patch: "0x4F_AST" };
    const hwResult = await SECURITY_TOOLS.HardwareAstMapper.handler(hwParams);
    console.error("Result:", hwResult);
    
    console.error("\n🌌 Testing SwarmDNAExtractor (Project Genesis)...");
    const dnaParams = { project_name: "YECO_Hospital_System", domain: "Healthcare" };
    const dnaResult = await SECURITY_TOOLS.SwarmDNAExtractor.handler(dnaParams);
    console.error("Result:", dnaResult);

    console.error("\n🌌 Testing ZeroTrustMerkleLedger (AST Blockchain)...");
    const ledgerParams = { target_module: "finance_payroll" };
    const ledgerResult = await SECURITY_TOOLS.ZeroTrustMerkleLedger.handler(ledgerParams);
    console.error("Result:", ledgerResult);

    if (hwResult.status === "hardware_patched" && dnaResult.status === "genesis_initiated" && ledgerResult.status === "merkle_locked") {
        console.error("\n✅ ALL TESTS PASSED. The Singularity Protocol is Online.");
    } else {
        console.error("\n❌ TESTS FAILED.");
    }
}

runSingularityTests();
