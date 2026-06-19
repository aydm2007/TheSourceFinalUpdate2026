const { SECURITY_TOOLS } = require('./core/security/tools_integrator.js');

async function runTests() {
    console.error("🚀 Testing QuantumHologram Tool (Opus Context Killer)...");
    const hologramParams = { target_directory: "./src", compression_level: 9 };
    const hologramResult = await SECURITY_TOOLS.QuantumHologram.handler(hologramParams);
    console.error("Result:", hologramResult);
    
    console.error("\n🚀 Testing VisualDomMapper Tool (Opus Vision Killer)...");
    const mapperParams = { dom_element_id: "submit-btn", client_map_path: "./package/cli.js.map" };
    const mapperResult = await SECURITY_TOOLS.VisualDomMapper.handler(mapperParams);
    console.error("Result:", mapperResult);

    if (hologramResult.status === "hologram_generated" && mapperResult.status === "visually_mapped") {
        console.error("\n✅ ALL TESTS PASSED. Opus Annihilation Protocol is Armed and 100% Stable.");
    } else {
        console.error("\n❌ TESTS FAILED.");
    }
}

runTests();
