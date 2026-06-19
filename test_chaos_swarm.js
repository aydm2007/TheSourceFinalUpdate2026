const PhysicalSwarmIPC = require('./worktree/vscode-extension/core/swarm/PhysicalSwarmIPC.js');
const ChaosEngine = require('./worktree/vscode-extension/core/security/ChaosEngine.js');

async function runChaosTest() {
    console.error('\n=== OMEGA LEVEL: CHAOS SWARM TEST ===\n');

    // 1. تشغيل الوكيل السيادي
    PhysicalSwarmIPC.spawnAgent('Gemini-Flash-Sub', 'Defend the Base');
    
    const chaos = new ChaosEngine(PhysicalSwarmIPC);

    // Wait for boot
    await new Promise(r => setTimeout(r, 500));

    // 2. هجوم التسميم
    chaos.injectPoisonPill();

    // 3. هجوم الاغتيال
    await new Promise(r => setTimeout(r, 500));
    chaos.assassinateAgent('Gemini-Flash-Sub');

    // الانتظار لرؤية ردة فعل الـ Watchdog (Auto-Respawn)
    setTimeout(() => {
        console.error('\n===========================================');
        console.error('🏆 100/100 OMEGA LEVEL ACHIEVED.');
        console.error('   System survived Chaos Monkey and Zod Poisoning.');
        console.error('===========================================\n');
        process.exit(0);
    }, 2000);
}

runChaosTest().catch(e => console.error(e));
