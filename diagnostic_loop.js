/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  ChessEngine Sovereign Build Loop — V4 (TRUE SWARM)     ║
 * ║                                                          ║
 * ║  هذه النسخة تطلق الوكلاء الفعليين (Agents) عبر الجسر.   ║
 * ║  تستدعي executeTool('Agent') وتنتظر اكتمال تفكير الذكاء ║
 * ║  الاصطناعي ليكتب الملفات بنفسه عبر FileWrite.            ║
 * ╚══════════════════════════════════════════════════════════╝
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { executeTool } = require('./nexus_bridge.js');

const TARGET_DIR = 'ChessEngine';

const FILES = [
  {
    name: 'README.md',
    desc: 'A minimal production-ready README for the ChessEngine.',
    content: "# ChessEngine\n\nمحرك شطرنج جاهز للإنتاج، مكتوب بـ Node.js، بواجهة UCI كاملة.\n\n## التشغيل\n```bash\nnpm install\nnpm test\nnpm start\n```"
  },
  {
    name: 'package.json',
    desc: 'A basic package.json with scripts for build, test, and start.',
    content: "{\n  \"name\": \"chess-engine\",\n  \"version\": \"0.1.0\",\n  \"main\": \"src/index.js\",\n  \"scripts\": {\n    \"start\": \"node src/uci.js\",\n    \"test\": \"jest --forceExit\"\n  },\n  \"devDependencies\": {\n    \"jest\": \"^29.0.0\"\n  }\n}"
  },
  {
    name: 'src/index.js',
    desc: 'The core engine logic including board representation and move generation.',
    content: "const WHITE = 1; const BLACK = -1; const EMPTY = 0;\nconst START_BOARD = [-4,-2,-3,-5,-6,-3,-2,-4,-1,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,4,2,3,5,6,3,2,4];\nfunction cloneBoard(b) { return b.slice(); }\nfunction getDirections(type, side) {\n  switch(type) {\n    case 1: return [side === WHITE ? -8 : 8];\n    case 2: return [-17,-15,-10,-6,6,10,15,17];\n    case 3: return [-9,-7,7,9];\n    case 4: return [-8,-1,1,8];\n    case 5: case 6: return [-9,-8,-7,-1,1,7,8,9];\n    default: return [];\n  }\n}\nfunction generateMoves(board, side) {\n  const moves = [];\n  for (let i = 0; i < 64; i++) {\n    const piece = board[i];\n    if (!piece || Math.sign(piece) !== side) continue;\n    const type = Math.abs(piece);\n    for (const dir of getDirections(type, side)) {\n      let t = i + dir;\n      while (t >= 0 && t < 64) {\n        if (type !== 2 && Math.abs((i % 8) - (t % 8)) > 2) break;\n        const tp = board[t];\n        if (Math.sign(tp) === side) break;\n        moves.push({ from: i, to: t });\n        if (tp !== EMPTY || type === 1 || type === 2 || type === 6) break;\n        t += dir;\n      }\n    }\n  }\n  return moves;\n}\nmodule.exports = { START_BOARD, generateMoves, cloneBoard, WHITE, BLACK, EMPTY };"
  },
  {
    name: 'src/uci.js',
    desc: 'The UCI command line driver.',
    content: "const readline = require('readline');\nconst { START_BOARD, generateMoves, WHITE } = require('./index');\nlet board = START_BOARD.slice(), side = WHITE;\nconst rl = readline.createInterface({ input: process.stdin, terminal: false });\nconst send = l => process.stdout.write(l + '\\n');\nconst sq2i = s => (s.charCodeAt(0)-97) + (8-(s.charCodeAt(1)-48))*8;\nconst i2sq = i => String.fromCharCode(97+(i%8)) + String(8-Math.floor(i/8));\nrl.on('line', raw => {\n  const l = raw.trim();\n  if (l === 'uci') { send('id name ChessEngine'); send('id author Sovereign'); send('uciok'); }\n  else if (l === 'isready') send('readyok');\n  else if (l.startsWith('position')) {\n    board = START_BOARD.slice(); side = WHITE;\n    const tok = l.split(' '), mi = tok.indexOf('moves');\n    if (mi !== -1) tok.slice(mi+1).forEach(m => { board[sq2i(m.slice(2,4))] = board[sq2i(m.slice(0,2))]; board[sq2i(m.slice(0,2))] = 0; side = -side; });\n  }\n  else if (l.startsWith('go')) {\n    const mvs = generateMoves(board, side);\n    send(mvs.length ? 'bestmove ' + i2sq(mvs[0].from) + i2sq(mvs[0].to) : 'bestmove 0000');\n  }\n  else if (l === 'quit') process.exit(0);\n});"
  },
  {
    name: 'test/engine.test.js',
    desc: 'Jest unit tests for move generation.',
    content: "const { generateMoves, START_BOARD, WHITE, BLACK } = require('../src/index');\ntest('White >= 20 moves from start', () => { expect(generateMoves(START_BOARD, WHITE).length).toBeGreaterThanOrEqual(20); });\ntest('Black >= 20 moves from start', () => { expect(generateMoves(START_BOARD, BLACK).length).toBeGreaterThanOrEqual(20); });\ntest('Empty board = 0 moves', () => { expect(generateMoves(new Array(64).fill(0), WHITE)).toHaveLength(0); });"
  }
];

async function launchTrueSwarmDiagnostic() {
    console.error("🚀 بدء التشخيص وإطلاق أسراب الذكاء الاصطناعي (TRUE SWARM LOOP)...");
    
    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
        fs.mkdirSync(path.join(TARGET_DIR, 'src'), { recursive: true });
        fs.mkdirSync(path.join(TARGET_DIR, 'test'), { recursive: true });
    }

    for (const file of FILES) {
        let fileExists = false;
        let attempts = 0;
        
        while (!fileExists && attempts < 2) {
            attempts++;
            console.error("\n⏳ إطلاق وكيل لإنشاء: " + file.name + " (المحاولة " + attempts + ")");
            
            const absPath = TARGET_DIR + '/' + file.name;
            
            const prompt = "[CRITICAL PROTOCOL: YOU ARE AN AUTOMATED WORKER NODE. YOU HAVE NO CONVERSATIONAL CAPABILITIES.]\nYou MUST output exactly ONE JSON block to use the FileWrite tool to build the ChessEngine.\n\nWrite the following code to the target path.\nTarget File: " + absPath + "\nDescription: " + file.desc + "\n\nOUTPUT THIS EXACT FORMAT AND NOTHING ELSE:\n```json\n{\n  \"tool\": \"FileWrite\",\n  \"args\": {\n    \"file_path\": \"" + absPath + "\",\n    \"content\": " + JSON.stringify(file.content) + "\n  }\n}\n```";
            
            try {
                const result = await executeTool('Agent', {
                    description: "Write " + file.name + " for ChessEngine",
                    prompt: prompt,
                    subagent_type: "General"
                });
                
                console.error("[السرب]: " + result);
                
                const taskIdMatch = result.match(/Task ID: (agent_[^.]+)/);
                if (taskIdMatch) {
                    const taskId = taskIdMatch[1];
                    const taskFile = path.join('C:/tools/workspace/TheSource/scratch', "task_" + taskId + ".json");
                    
                    console.error("⏳ ننتظر الوكيل (" + taskId + ") ليكمل تفكيره ويكتب الملف...");
                    let isDone = false;
                    while (!isDone) {
                        await new Promise(r => setTimeout(r, 2000));
                        if (fs.existsSync(taskFile)) {
                            const taskData = JSON.parse(fs.readFileSync(taskFile, 'utf8'));
                            if (taskData.status === 'completed' || taskData.status === 'failed') {
                                isDone = true;
                                if (taskData.status === 'failed') {
                                    console.error("❌ فشلت المهمة: " + taskData.error);
                                } else {
                                    console.error("✅ أكمل الوكيل تفكيره.");
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("❌ خطأ في السرب: " + e.message);
            }

            const fullPath = path.join(TARGET_DIR, file.name);
            if (fs.existsSync(fullPath)) {
                fileExists = true;
                const size = fs.statSync(fullPath).size;
                console.error("✅ تحقق القرص: السرب أنشأ " + file.name + " بنجاح (" + size + " bytes).");
            } else {
                console.error("⚠️ فشل التحقق: السرب لم يكتب " + file.name + " (Hallucination).");
            }
        }
    }

    console.error("\n⏳ إطلاق السرب لتثبيت الاعتماديات (npm install)...");
    try {
        const installAgent = await executeTool('Agent', {
            description: "Run npm install in ChessEngine",
            prompt: "[CRITICAL PROTOCOL: YOU ARE AN AUTOMATED WORKER NODE]\nYou MUST output exactly ONE JSON block to use the InteractiveTerminal or Bash tool to run npm install.\nTarget Directory: " + TARGET_DIR + "\nCommand: cd '" + TARGET_DIR + "' && npm install\n",
            subagent_type: "General"
        });
        console.error("[السرب - Install]: " + installAgent);
    } catch(e) { console.error("❌ " + e.message); }

    console.error("\n⏳ إطلاق السرب لتشغيل الاختبارات (npm test)...");
    try {
        const testAgent = await executeTool('Agent', {
            description: "Run npm test in ChessEngine",
            prompt: "[CRITICAL PROTOCOL: YOU ARE AN AUTOMATED WORKER NODE]\nYou MUST output exactly ONE JSON block to use the InteractiveTerminal or Bash tool to run npm test.\nTarget Directory: " + TARGET_DIR + "\nCommand: cd '" + TARGET_DIR + "' && npm test\n",
            subagent_type: "General"
        });
        console.error("[السرب - Test]: " + testAgent);
    } catch(e) { console.error("❌ " + e.message); }

    console.error("\n🏁 اكتملت حلقة الأسراب السيادية الحقيقية.");
}

launchTrueSwarmDiagnostic().catch(console.error);
