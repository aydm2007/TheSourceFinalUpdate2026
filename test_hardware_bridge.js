const { executeTool } = require('./nexus_bridge.js');

async function testHardwareProbe() {
    console.error("Initializing AlphaHardwareProbe via MCP Bridge...");
    try {
        const result = await executeTool('AlphaHardwareProbe', {});
        console.error("\n[SUCCESS] Hardware Telemetry Received:");
        console.error(result);
    } catch (e) {
        console.error("[ERROR]", e.message);
    }
}

testHardwareProbe();
