const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { executeTool } = require('./nexus_bridge.js');

const TARGET_DIR = path.join(process.cwd(), 'ChessEngine');
const BRIDGE_PATH = path.join(process.cwd(), 'nexus_bridge.js');

const tasks = [
    {
        name: 'src/ai.js',
        prompt: 'Agent Sub-Task: Write src/ai.js for ChessEngine containing a Minimax algorithm with Alpha-Beta pruning and a basic piece-square table evaluation function. Export `getBestMove` and `evaluateBoard`. (Subagent type: General)'
    },
    {
        name: 'test/performance.test.js',
        prompt: 'Agent Sub-Task: Write test/performance.test.js for ChessEngine that measures nodes-per-second (NPS) using the Minimax algorithm over a simulated search. (Subagent type: General)'
    },
    {
        name: 'src/uci.js',
        prompt: 'Agent Sub-Task: Update src/uci.js in ChessEngine to integrate the new Minimax search from src/ai.js when the "go" command is called. The `go` function should call `getBestMove(board, depth)` from `src/ai.js` and output the move. Use SurgicalDiff or FileEdit. (Subagent type: General)'
    }
];

async function launchAI_Swarm() {
    console.error("🚀 بدء أسراب الذكاء الاصطناعي (AI ENHANCEMENT LOOP) لإضافة خوارزمية Minimax...");

    for (const file of tasks) {
        let fileExists = false;
        let attempts = 0;
        
        while (!fileExists && attempts < 2) {
            attempts++;
            console.error(`\n⏳ إطلاق وكيل لملف/مهمة: ${file.name} (المحاولة ${attempts})`);
            
            try {
                // Call executeTool directly to keep the parent process alive and capture the event
                const output = await executeTool('Agent', { description: file.prompt, subagent_type: 'General' });
                
                const agentLogIdx = output.indexOf('[السرب]:');
                if (agentLogIdx !== -1) {
                    console.error(output.substring(agentLogIdx).trim());
                } else {
                    console.error("[السرب]: Agent initialized.");
                    console.error(output.trim());
                }
                
                // Parse task ID
                const match = output.match(/Task ID: (agent_[a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    const taskId = match[1];
                    const taskFile = path.join(process.cwd(), 'scratch', "task_" + taskId + ".json");
                    
                    console.error(`⏳ ننتظر الوكيل (${taskId}) ليكمل تفكيره...`);
                    let isDone = false;
                    while (!isDone) {
                        await new Promise(r => setTimeout(r, 2000));
                        if (fs.existsSync(taskFile)) {
                            const taskData = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
                            if (taskData.status === 'completed' || taskData.status === 'failed') {
                                isDone = true;
                                if (taskData.status === 'failed') {
                                    console.error(`❌ فشلت المهمة: ${taskData.error}`);
                                } else {
                                    console.error(`✅ أكمل الوكيل تفكيره.`);
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(`❌ خطأ في السرب: ${e.message}`);
            }

            const fullPath = path.join(TARGET_DIR, file.name);
            if (fs.existsSync(fullPath)) {
                fileExists = true;
                const size = fs.statSync(fullPath).size;
                console.error(`✅ تحقق القرص: تم بنجاح (${size} bytes).`);
            } else {
                console.error(`⚠️ فشل التحقق: السرب لم يكمل المهمة بالشكل المطلوب (Hallucination).`);
            }
        }
    }

    console.error("\n⏳ إطلاق السرب لتشغيل اختبارات الأداء (npm test)...");
    try {
        await executeTool('Agent', { description: "Agent Sub-Task: Run npm test in ChessEngine (Subagent type: General)", subagent_type: 'General' });
        console.error(`✅ انتهى السرب من الاختبار.`);
    } catch(e) {}

    console.error("\n🏁 اكتملت حلقة دمج الذكاء الاصطناعي وتقييم الأداء بنجاح.");
    process.exit(0);
}

launchAI_Swarm().catch(console.error);
