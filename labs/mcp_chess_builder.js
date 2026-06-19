const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const MCP_SERVER_PATH = path.join(__dirname, '..', 'mcp_bridge_server.js');
const TARGET_DIR = path.join(__dirname, '..', 'Chess_Engine2');

// Ensure target directory exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// ---------------------------------------------------------
// The Payloads (Chess Engine Codes)
// ---------------------------------------------------------

const htmlPayload = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Sovereign Chess</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="background-orb orb-1"></div>
    <div class="glass-container">
        <header>
            <h1>MCP Swarm Chess</h1>
            <div class="status-panel">
                <span id="turn-indicator">دور: الأبيض</span>
            </div>
        </header>
        <main>
            <div id="chessboard" class="chessboard"></div>
        </main>
    </div>
    <script src="engine.js"></script>
</body>
</html>`;

const cssPayload = `:root {
    --primary-glow: #8a2be2;
    --glass-bg: rgba(20, 20, 25, 0.6);
    --glass-border: rgba(255, 255, 255, 0.1);
    --square-light: rgba(255, 255, 255, 0.9);
    --square-dark: rgba(120, 130, 160, 0.9);
    --text-color: #ffffff;
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
body { background-color: #0b0c10; color: var(--text-color); min-height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden; position: relative; }
.background-orb { position: absolute; border-radius: 50%; filter: blur(100px); z-index: -1; width: 40vw; height: 40vw; background: var(--primary-glow); top: -10%; left: -10%; opacity: 0.4; }
.glass-container { background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 24px; padding: 2rem; width: 95%; max-width: 900px; position: relative; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; }
h1 { font-weight: 700; font-size: 2rem; }
#turn-indicator { padding: 0.5rem 1rem; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); }
.chessboard { display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); width: 500px; height: 500px; border: 2px solid var(--glass-border); border-radius: 12px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.square { display: flex; justify-content: center; align-items: center; font-size: 3rem; cursor: pointer; user-select: none; }
.square.light { background-color: var(--square-light); color: #333; }
.square.dark { background-color: var(--square-dark); color: #111; }
.piece { transition: transform 0.2s; z-index: 10; }
.piece:hover { transform: scale(1.1); }
`;

const jsPayload = `const PIECES = {
    wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
    bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟', empty: ''
};
const INITIAL_BOARD = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
];
class MCPChess {
    constructor() {
        this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        this.turn = 'w';
        this.boardElement = document.getElementById('chessboard');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.renderBoard();
    }
    renderBoard() {
        this.boardElement.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = \`square \${(row + col) % 2 === 0 ? 'light' : 'dark'}\`;
                const pieceId = this.board[row][col];
                if (pieceId !== 'empty') {
                    const piece = document.createElement('span');
                    piece.className = 'piece';
                    piece.textContent = PIECES[pieceId];
                    if(pieceId.startsWith('w')) piece.style.textShadow = "0 0 5px rgba(255,255,255,0.8)";
                    else piece.style.textShadow = "0 0 5px rgba(0,0,0,0.8)";
                    square.appendChild(piece);
                }
                this.boardElement.appendChild(square);
            }
        }
    }
}
document.addEventListener('DOMContentLoaded', () => new MCPChess());
`;

// ---------------------------------------------------------
// The MCP Tool Calls Sequence
// ---------------------------------------------------------
const queue = [
    {
        id: 1,
        method: "tools/call",
        params: { name: "nexus_LoadSkill", arguments: { skill: "ux-hypnotist" } }
    },
    {
        id: 2,
        method: "tools/call",
        params: { name: "nexus_FileSystemManager", arguments: { action: "FileWrite", payload: { file_path: path.join(TARGET_DIR, 'index.html'), content: htmlPayload } } }
    },
    {
        id: 3,
        method: "tools/call",
        params: { name: "nexus_FileSystemManager", arguments: { action: "FileWrite", payload: { file_path: path.join(TARGET_DIR, 'styles.css'), content: cssPayload } } }
    },
    {
        id: 4,
        method: "tools/call",
        params: { name: "nexus_LoadSkill", arguments: { skill: "react-surgeon" } }
    },
    {
        id: 5,
        method: "tools/call",
        params: { name: "nexus_FileSystemManager", arguments: { action: "FileWrite", payload: { file_path: path.join(TARGET_DIR, 'engine.js'), content: jsPayload } } }
    }
];

// ---------------------------------------------------------
// Engine Orchestration
// ---------------------------------------------------------
console.log('🚀 [MCP Builder] Spawning real MCP Server...');

const mcpProcess = spawn('node', [MCP_SERVER_PATH], {
    cwd: path.join(__dirname, '..'),
    env: Object.assign({}, process.env, { SIMULATION_DRY_RUN: 'false', LIVE_EDIT_MODE: 'true' })
});

let isReady = false;
let responseBuffer = '';

mcpProcess.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('Sovereign stdio MCP bridge active') && !isReady) {
        isReady = true;
        console.log('✅ [MCP Builder] Bridge Active. Commencing Agent Orchestration Sequence...\n');
        processNext();
    }
});

mcpProcess.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    if (responseBuffer.includes('"jsonrpc"')) {
        const lines = responseBuffer.split('\n');
        responseBuffer = ''; // Reset buffer, we will keep unparsed lines
        
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const res = JSON.parse(line);
                if (res.jsonrpc === '2.0') {
                    console.log(`🤖 [MCP Server Response ID:${res.id}]:`);
                    if (res.error || (res.result && res.result.isError)) {
                        console.log('❌ Error:', JSON.stringify(res.result || res.error));
                    } else {
                        console.log('✅ Success:', res.result.content[0].text.substring(0, 100) + '...');
                    }
                    setTimeout(processNext, 500);
                }
            } catch (err) {
                // Not a full JSON line yet, or just log output, keep in buffer
                responseBuffer += line + '\n';
            }
        }
    }
});

function processNext() {
    if (queue.length === 0) {
        console.log('\n🎉 [MCP Builder] Orchestration Complete! Terminating Server...');
        mcpProcess.kill();
        verify();
        return;
    }
    
    const req = queue.shift();
    console.log(`\n📨 [MCP Builder] Sending Tool Call: ${req.params.name}`);
    mcpProcess.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...req }) + '\n');
}

function verify() {
    console.log('\n🔍 [MCP Builder] Verifying Physical Files written by MCP Server:');
    const files = fs.readdirSync(TARGET_DIR);
    console.log(`📁 Target Directory (${TARGET_DIR}):`);
    files.forEach(f => console.log(`   - ${f}`));
}
