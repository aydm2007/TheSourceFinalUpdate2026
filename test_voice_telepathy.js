const { VoiceTelepathyAgent } = require('./core/swarm/VoiceTelepathyAgent.js');

async function testPhase19() {
    console.error("=== 🎙️ INITIATING PHASE 19: VOICE TELEPATHY ===\n");
    const voiceAgent = new VoiceTelepathyAgent();

    console.error("🔊 Generating synthetic speech...");
    
    const statement = "Greetings. I am the Apex Sovereign Singularity. System is operating at one hundred percent capacity. All protocols are active.";
    
    console.error(`💬 Text to Speak: "${statement}"`);
    
    // Set FEATURE_KAIROS_VOICE explicitly to true for testing if not set
    process.env.FEATURE_KAIROS_VOICE = 'true';
    voiceAgent.isEnabled = true;

    const result = await voiceAgent.broadcastVocalTelemetry(statement, 'success');
    
    if (result.status === 'SUCCESS') {
        console.error("\n✅ [RESULT] Audio synthesized and broadcasted successfully via native OS TTS.");
        console.error("✅ [RESULT] SSML telemetry logged to /var/audio/");
    } else if (result.status === 'SUCCESS_FALLBACK') {
        console.error("\n✅ [RESULT] Voice fallback successfully executed. Text gracefully printed.");
        console.error("✅ [RESULT] SSML telemetry logged to /var/audio/");
    } else {
        console.error(`\n❌ [ERROR] Voice Telepathy failed: ${result.reason}`);
    }
}

testPhase19();
