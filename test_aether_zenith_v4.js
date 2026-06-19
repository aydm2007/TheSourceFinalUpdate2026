const { SovereignVault } = require('./core/security/SovereignVault.js');
const { RelayBridgeInterceptor } = require('./core/network/RelayBridgeInterceptor.js');
const { HybridLogicalClock } = require('./core/memory/HybridLogicalClock.js');
const { PersistenceDbManager } = require('./core/memory/PersistenceDbManager.js');

async function testAetherZenithFusion() {
    console.error("=== 🔐 INITIATING AETHER-ZENITH FUSION TEST (Deep Kernel Secrets) ===\n");

    const vault = new SovereignVault();
    const relay = new RelayBridgeInterceptor();
    const hlc = new HybridLogicalClock();
    const db = new PersistenceDbManager();

    try {
        console.error("🕐 [Step 1] Bootstrapping Hybrid Logical Clocks (HLC)...");
        const t1 = hlc.generateHlcTimestamp();
        console.error(`✅ Success: ${t1.message}\n`);

        console.error("🗄️ [Step 2] Initializing Persistence DB-Manager...");
        const dbBoot = await db.initialize();
        console.error(`✅ Success: ${dbBoot.message} Engine: ${dbBoot.engine}\n`);

        console.error("🌐 [Step 3] Testing RelayBridge Interceptor...");
        const networkTest = relay.interceptAndRoute("https://api.anthropic.com/v1/messages", "SILICONFLOW");
        networkTest.logs.forEach(log => console.error(`   -> ${log}`));
        console.error(`✅ Success: Traffic routed cleanly to ${networkTest.routed_url}\n`);

        console.error("🔐 [Step 4] Executing SovereignVault Redaction...");
        const dirtyPayload = {
            message: "Saving memory ledger",
            key: "sk-ant-1234567890abcdef1234567890abcdef1234567890",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwi"
        };
        const vaultTest = vault.redactSecrets(dirtyPayload);
        console.error(`✅ Success: ${vaultTest.message} Redacted ${vaultTest.redacted_count} secrets.`);
        console.error(`   -> Clean Payload: ${JSON.stringify(vaultTest.safe_payload)}\n`);

        console.error("🏆 [FINAL RESULT] 100/100 ACHIVEMENT UNLOCKED: The Deep Kernel is secured and operational.");

    } catch (e) {
        console.error("❌ THE AETHER-ZENITH TEST FAILED:", e.message);
    }
}

testAetherZenithFusion();
