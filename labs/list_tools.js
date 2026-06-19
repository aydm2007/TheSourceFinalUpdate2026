const cp = require('child_process');
const p = cp.spawn('node', ['mcp_bridge_server.js']);
let out = '';
p.stdout.on('data', d => { out += d.toString(); });
p.stderr.on('data', d => {
    if(d.toString().includes('active')) {
        p.stdin.write(JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'nexus_LoadSkill', arguments: { skill: 'ux-hypnotist' } }}) + '\n');
        setTimeout(() => {
            p.stdin.write(JSON.stringify({jsonrpc: '2.0', id: 2, method: 'tools/list'}) + '\n');
        }, 500);
    }
});
setTimeout(() => {
    p.kill();
    const t = out.split('\n').find(l => l.includes('"id":2'));
    if (t) {
        const parsed = JSON.parse(t);
        const fsm = parsed.result.tools.find(x => x.name === 'nexus_FileSystemManager');
        console.log(JSON.stringify(fsm, null, 2));
    }
}, 4000);
