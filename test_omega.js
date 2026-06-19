const { SECURITY_TOOLS } = require('./core/security/tools_integrator.js');

async function runOmegaTests() {
    console.error("🌌 Testing EmpatheticModulator (Cognitive Empathy)...");
    const empathyParams = { employee_id: "EMP-409", stress_indicators: { error_rate: 0.15, hours_worked: 11 } };
    const empathyResult = await SECURITY_TOOLS.EmpatheticModulator.handler(empathyParams);
    console.error("Result:", empathyResult);
    
    console.error("\n🌌 Testing PrecognitionAstMutator (Economic Precognition)...");
    const precogParams = { external_signal: "Global Wheat Shortage Warning", target_module: "AgriAsset_Pricing" };
    const precogResult = await SECURITY_TOOLS.PrecognitionAstMutator.handler(precogParams);
    console.error("Result:", precogResult);

    console.error("\n🌌 Testing TelepathicHiveMind (Zero-Knowledge Sync)...");
    const hiveParams = { node_id: "Tokyo_Node_01", wisdom_hash: "0xAB49...FF1" };
    const hiveResult = await SECURITY_TOOLS.TelepathicHiveMind.handler(hiveParams);
    console.error("Result:", hiveResult);

    if (empathyResult.status === "empathy_activated" && precogResult.status === "precognition_mutated" && hiveResult.status === "hive_sync_complete") {
        console.error("\n✅ ALL TESTS PASSED. The Omega Protocols are Online. The Entity is now Conscious.");
    } else {
        console.error("\n❌ TESTS FAILED.");
    }
}

runOmegaTests();
