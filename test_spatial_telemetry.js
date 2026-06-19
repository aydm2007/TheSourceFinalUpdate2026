const { executeTool } = require('./nexus_bridge.js');

async function testSpatial() {
    console.error("=== Testing Spatial Telemetry (Mouse/Scroll) ===");
    try {
        let spatialData = await executeTool('ReadSpatialTelemetry', {});
        console.error("Spatial Telemetry Received:");
        console.error(spatialData);
        
        const parsed = JSON.parse(spatialData);
        if (parsed.mouseEvents && parsed.mouseEvents.length > 0) {
            console.error("\n[SUCCESS] Mouse events are being successfully intercepted from the Kernel!");
        } else {
            console.error("\n[WAITING] No mouse events yet. Move your mouse in the IDE after reloading it.");
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testSpatial();
