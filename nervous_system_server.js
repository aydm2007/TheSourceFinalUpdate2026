const WebSocket = require('ws');
const { execSync } = require('child_process');

function isPortInUse(port) {
    try {
        if (process.platform === 'win32') {
            const output = execSync(`netstat -aon | findstr :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
            return output.includes('LISTENING');
        } else {
            execSync(`lsof -t -i:${port}`, { stdio: ['pipe', 'pipe', 'pipe'] });
            return true;
        }
    } catch (e) {
        return false; // Port is free
    }
}

const PORT = 9999;
const HTTP_PORT = 9998;

const shouldBind = require.main === module || 
                   (process.argv[1] && (
                       process.argv[1].includes('mcp_remote_server') || 
                       process.argv[1].includes('mcp_bridge_server') || 
                       process.argv[1].includes('restart_nervous_system')
                   )) || 
                   process.env.START_NERVOUS_SYSTEM === 'true';

let wss;

if (shouldBind) {
    // Safe port binding: skip if already in use instead of force-killing
    // This prevents race conditions that crash the parent stdio bridge process
    if (isPortInUse(PORT)) {
        console.error(`[Nervous System] Port ${PORT} already in use — reusing existing instance (no kill).`);
    } else {
        try {
            wss = new WebSocket.Server({ port: PORT });
            
            wss.on('error', (error) => {
                console.error(`[Nervous System] WebSocket Server error: ${error.message}`);
            });
            
            wss.on('connection', (ws) => {
                console.error(`[Nervous System] IDE Client Connected.`);
                
                ws.on('message', (message) => {
                    try {
                        const data = JSON.parse(message);
                        if (data.type === 'IDE_TELEMETRY') {
                            console.error(`[Nervous System] IDE Telemetry: ${data.payload.event}`);
                            if (!global.ideState) global.ideState = { mouseEvents: [], scrollEvents: [] };
                            if (data.payload.event === 'LINTER_SQUIGGLES') {
                                global.ideState.diagnostics = data.payload.diagnostics;
                            }
                            if (data.payload.event === 'ACTIVE_EDITOR_CHANGE') {
                                global.ideState.activeEditor = data.payload.file;
                            }
                            if (data.payload.event === 'MOUSE_INTERCEPTED') {
                                // Keep only the last 10 mouse events to prevent memory leaks
                                global.ideState.mouseEvents.push(data.payload.args);
                                if (global.ideState.mouseEvents.length > 10) global.ideState.mouseEvents.shift();
                            }
                        }
                        if (data.type === 'CANVAS_FRAME_UPDATE') {
                            console.error(`[Nervous System] Canvas Frame Update received.`);
                            if (!global.ideState) global.ideState = { mouseEvents: [], scrollEvents: [] };
                            global.ideState.canvasState = {
                                timestamp: new Date().toISOString(),
                                frameHash: data.payload.frameHash,
                                width: data.payload.width,
                                height: data.payload.height,
                                webglVendor: data.payload.webglVendor,
                                drawCalls: data.payload.drawCalls || 0
                            };
                        }
                    } catch (e) {
                        console.error('[Nervous System] Error parsing message:', e);
                    }
                });

                ws.on('close', () => {
                    console.error(`[Nervous System] IDE Client Disconnected.`);
                });
            });

        } catch (error) {
            console.error(`[Nervous System] Failed to start WebSocket server: ${error.message}`);
        }
    }
}

function sendToIDE(action, payload) {
    if (!wss) return false;
    
    let sent = false;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'GUI_ACTION',
                action: action,
                payload: payload
            }));
            sent = true;
        }
    });
    return sent;
}

// ==========================================
// HTTP Bridge (For MCP Live Demonstrations)
// ==========================================
const http = require('http');
const HardwareBridge = require('./alpha_hardware_bridge.js');

if (shouldBind) {
    if (isPortInUse(HTTP_PORT)) {
        console.error(`[Nervous System] HTTP port ${HTTP_PORT} already in use — reusing existing instance (no kill).`);
    } else {
        try {
            const server = http.createServer((req, res) => {
                if (req.method === 'GET' && req.url === '/diagnostics') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        diagnostics: (global.ideState && global.ideState.diagnostics) || [] 
                    }));
                    return;
                }

                if (req.method === 'GET' && req.url === '/spatial') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        mouseEvents: (global.ideState && global.ideState.mouseEvents) || [],
                        scrollEvents: (global.ideState && global.ideState.scrollEvents) || []
                    }));
                    return;
                }

                if (req.method === 'GET' && req.url === '/canvas/telemetry') {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        canvasState: (global.ideState && global.ideState.canvasState) || {
                            timestamp: new Date().toISOString(),
                            frameHash: 'mock_canvas_webgl_frame_hash_v1',
                            width: 800,
                            height: 600,
                            webglVendor: 'Google Inc. (Intel)',
                            drawCalls: 42
                        }
                    }));
                    return;
                }

                if (req.method === 'POST' && req.url === '/send') {
                    let body = '';
                    req.on('data', chunk => { body += chunk.toString(); });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const success = sendToIDE(data.action, data.payload);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success, message: success ? 'Sent to IDE' : 'No IDE connected' }));
                        } catch (e) {
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
                        }
                    });
                } else if (req.method === 'GET' && req.url === '/hardware') {
                    HardwareBridge.getFullOmegaTelemetry().then(telemetry => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(telemetry));
                    }).catch(err => {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: err.message }));
                    });
                } else if (req.method === 'POST' && req.url === '/hardware/hello') {
                    HardwareBridge.requestWindowsHelloAuth().then(result => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    });
                } else {
                    res.writeHead(404);
                    res.end();
                }
            });
            server.on('error', (error) => {
                console.error(`[Nervous System] HTTP Bridge server error: ${error.message}`);
            });
            server.listen(HTTP_PORT, () => {
                console.error(`[Nervous System] HTTP Bridge active on port ${HTTP_PORT} (Listening for MCP Triggers)`);
            });
        } catch(e) {
            console.error(`[Nervous System] Failed to start HTTP Bridge: ${e.message}`);
        }
    }
}

module.exports = {
    port: PORT,
    sendToIDE
};
