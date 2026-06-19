const axios = require('axios');

async function testSpatial() {
    console.error("=== Testing Spatial Telemetry (Mouse/Scroll) via HTTP ===");
    try {
        let resp = await axios.get('http://localhost:9998/spatial');
        let spatialData = resp.data;
        
        console.error("Spatial Telemetry Received:");
        console.error(spatialData);
        
        if (spatialData.mouseEvents && spatialData.mouseEvents.length > 0) {
            console.error("\n[SUCCESS] Mouse events are being successfully intercepted from the Kernel!");
        } else {
            console.error("\n[WAITING] No mouse events yet. Move your mouse in the IDE after reloading it.");
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testSpatial();
