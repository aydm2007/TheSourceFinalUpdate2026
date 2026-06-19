const { spawn } = require('child_process');

const p = spawn('node', ['mcp_bridge_server.js']);

p.stdout.on('data', d => console.log('OUT:', d.toString()));
p.stderr.on('data', d => console.error('ERR:', d.toString()));
p.on('close', code => console.log('EXIT:', code));

console.log("Sending initialize");
p.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0" }
    }
}) + '\n');

setTimeout(() => {
    console.log("Sending initialized");
    p.stdin.write(JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized"
    }) + '\n');
    
    setTimeout(() => {
        console.log("DONE WAITING, KILLING");
        p.kill();
    }, 5000);
}, 6000);
