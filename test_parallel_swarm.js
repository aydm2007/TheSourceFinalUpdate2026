const { SECURITY_TOOLS } = require('./core/security/tools_integrator.js');

async function runParallelTests() {
    console.error("🌌 Testing AstMutexLockManager (AST Locking)...");
    const lockParams = { file_path: "src/FinanceEngine.js", line_range: [15, 30], agent_id: "react-surgeon" };
    const lockResult = await SECURITY_TOOLS.AstMutexLockManager.handler(lockParams);
    console.error("Result:", lockResult);
    
    console.error("\n🌌 Testing ParallelSwarmCoordinator (Worker Threads)...");
    const swarmParams = { task_id: "TASK_1001", agents: ["react-surgeon", "db-forensics", "security-audit"] };
    const swarmResult = await SECURITY_TOOLS.ParallelSwarmCoordinator.handler(swarmParams);
    console.error("Result:", swarmResult);

    console.error("\n🌌 Testing AsyncBackgroundJob (Detached Execution)...");
    const jobParams = { job_name: "Deep_Database_Rebuild", estimated_minutes: 45 };
    const jobResult = await SECURITY_TOOLS.AsyncBackgroundJob.handler(jobParams);
    console.error("Result:", jobResult);

    if (lockResult.status === "ast_locked" && swarmResult.status === "parallel_swarm_launched" && jobResult.status === "job_detached") {
        console.error("\n✅ ALL TESTS PASSED. Parallel Swarm Integration is Online. Opus 4.6 is now fully defeated.");
    } else {
        console.error("\n❌ TESTS FAILED.");
    }
}

runParallelTests();
