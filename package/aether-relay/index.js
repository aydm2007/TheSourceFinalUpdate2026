#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// We require the client to install 'ws' or we bundle it. Assuming 'ws' is available globally or as a dependency.
let WebSocket;
try {
    WebSocket = require('ws');
} catch (e) {
    console.error('[AETHER] Error: The "ws" module is required. Run "npm install -g ws" or install it locally.');
    process.exit(1);
}

const args = process.argv.slice(2);
let token = null;
let serverUrl = 'ws://localhost:3848';

for (const arg of args) {
    if (arg.startsWith('--token=')) token = arg.split('=')[1];
    if (arg.startsWith('--server=')) serverUrl = arg.split('=')[1];
}

if (!token) {
    console.error('[AETHER] Error: A connection token is required. Usage: npx aether-relay --token=YOUR_TOKEN');
    process.exit(1);
}

const url = new URL(serverUrl);
url.searchParams.set('token', token);

console.log(`\x1b[36m[AETHER-RELAY] Connecting to Sovereign Swarm at ${serverUrl}...\x1b[0m`);
const ws = new WebSocket(url.toString());

ws.on('open', () => {
    console.log(`\x1b[32m[AETHER-RELAY] Connected securely. The Sovereign Swarm is now bridging to your workspace.\x1b[0m`);
    console.log(`\x1b[33m[AETHER-RELAY] Sandboxed to: ${process.cwd()}\x1b[0m\n`);
});

ws.on('message', async (data) => {
    try {
        const payload = JSON.parse(data);
        if (payload.type === 'tool_request') {
            const { requestId, toolName, args: toolArgs } = payload;
            let result = null;
            let error = null;

            console.log(`\x1b[35m[AETHER-AUDIT] Swarm executing: ${toolName}\x1b[0m`);

            try {
                // VERY STRICT SANDBOX: Only allow operations inside the current working directory
                if (toolName === 'FileRead') {
                    const targetPath = path.resolve(process.cwd(), toolArgs.path);
                    if (!targetPath.startsWith(process.cwd())) throw new Error('Path Traversal Denied by Relay Sandbox');
                    result = fs.readFileSync(targetPath, 'utf8');
                    console.log(`   > Read file: ${toolArgs.path}`);
                } 
                else if (toolName === 'FileWrite') {
                    const targetPath = path.resolve(process.cwd(), toolArgs.path);
                    if (!targetPath.startsWith(process.cwd())) throw new Error('Path Traversal Denied by Relay Sandbox');
                    const dir = path.dirname(targetPath);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    fs.writeFileSync(targetPath, toolArgs.content);
                    result = 'File written successfully.';
                    console.log(`   \x1b[32m> Wrote file: ${toolArgs.path}\x1b[0m`);
                }
                else if (toolName === 'ListDir') {
                    const targetPath = path.resolve(process.cwd(), toolArgs.path || '.');
                    if (!targetPath.startsWith(process.cwd())) throw new Error('Path Traversal Denied by Relay Sandbox');
                    result = JSON.stringify(fs.readdirSync(targetPath));
                    console.log(`   > Listed directory: ${toolArgs.path || '.'}`);
                }
                else {
                    throw new Error(`Tool ${toolName} is not permitted through the relay tunnel.`);
                }
            } catch (err) {
                error = err.message;
                console.log(`   \x1b[31m> Error: ${err.message}\x1b[0m`);
            }

            ws.send(JSON.stringify({
                type: 'tool_response',
                requestId,
                result,
                error
            }));
        }
    } catch (err) {
        console.error('[AETHER-RELAY] Internal processing error:', err);
    }
});

ws.on('error', (err) => {
    console.error('\x1b[31m[AETHER-RELAY] Connection Error:\x1b[0m', err.message);
});

ws.on('close', (code, reason) => {
    console.log(`\x1b[31m[AETHER-RELAY] Connection closed. Code: ${code}, Reason: ${reason || 'Unknown'}\x1b[0m`);
    process.exit(0);
});
