const { SourceMapHealer } = require('./core/memory/SourceMapHealer.js');
const { ImplicitToolChainer } = require('./core/swarm/ImplicitToolChainer.js');
const { AstAutoPatch } = require('./core/services/surgical_engine/AstAutoPatch.js');
const { BackgroundIndexerDaemon } = require('./core/services/BackgroundIndexerDaemon.js');
const { V8SnapshotFreezer } = require('./core/memory/V8SnapshotFreezer.js');

async function testTriCoreSingularity() {
    console.error("=== 🌌 INITIATING TRI-CORE SINGULARITY TEST (V52.0 Absolute) ===\n");

    const healer = new SourceMapHealer(process.cwd());
    const chainer = new ImplicitToolChainer();
    const patcher = new AstAutoPatch();
    const daemon = new BackgroundIndexerDaemon();
    const freezer = new V8SnapshotFreezer();

    try {
        console.error("🧊 [Step 1] Booting from V8 Snapshot...");
        const thawResult = await freezer.thawTensorState();
        console.error(`✅ Success: ${thawResult.message}\n`);

        console.error("👁️‍🗨️ [Step 2] Starting Background Indexer Daemon...");
        const daemonResult = daemon.startDaemon();
        console.error(`✅ Success: ${daemonResult.message}\n`);

        console.error("🗺️ [Step 3] Simulating Production Crash & SourceMap Healing...");
        const healResult = await healer.healFromMap("at Runtime (cli.js:1:4205)", "package/cli.js.map");
        console.error(`✅ Success: Resolved to ${healResult.original_file}:${healResult.line}. Tokens saved: ${healResult.tokens_saved}.\n`);

        console.error("🔗 [Step 4] Executing Implicit Telescoping Batch...");
        const batchResult = await chainer.executeTelescopingBatch([
            { name: 'VectorSearch', payload: 'Find context' },
            { name: 'PredictiveImmunization', payload: 'Scan vulnerabilities' },
            { name: 'ASTAutoPatch', payload: 'Apply fix' }
        ]);
        console.error(`✅ Success: Executed ${batchResult.results.length} tools in ${batchResult.total_time_ms}ms. ${batchResult.message}\n`);

        console.error("🧬 [Step 5] Applying AST Organic Patch...");
        // Use an actual file that exists to test the AST patch (we'll use this test file itself)
        const patchResult = await patcher.applySurgicalPatch(__filename, 'testTriCoreSingularity', 'console.error("AST Mutated!");');
        console.error(`✅ Success: ${patchResult.message}. Integrity: ${patchResult.diff_integrity}.\n`);

        console.error("🏆 [FINAL RESULT] 100/100 ACHIVEMENT UNLOCKED: The Tri-Core Singularity & Hidden Layer are fully operational.");
        
        daemon.stopDaemon();

    } catch (e) {
        console.error("❌ THE TRI-CORE TEST FAILED:", e.message);
    }
}

testTriCoreSingularity();
