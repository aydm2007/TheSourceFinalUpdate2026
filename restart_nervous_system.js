const { exec } = require('child_process');

function restartServer() {
    console.error("Killing old Nervous System processes...");
    // Find and kill processes running on ports 9999 and 9998
    exec('netstat -ano | findstr :9999', (err, stdout) => {
        if (stdout) {
            const lines = stdout.split('\\n');
            lines.forEach(line => {
                const parts = line.trim().split(/\\s+/);
                if (parts.length > 4) {
                    const pid = parts[parts.length - 1];
                    console.error(`Killing process on 9999: PID ${pid}`);
                    exec(`taskkill /F /PID ${pid}`, () => {});
                }
            });
        }
        
        exec('netstat -ano | findstr :9998', (err, stdout) => {
            if (stdout) {
                const lines = stdout.split('\\n');
                lines.forEach(line => {
                    const parts = line.trim().split(/\\s+/);
                    if (parts.length > 4) {
                        const pid = parts[parts.length - 1];
                        console.error(`Killing process on 9998: PID ${pid}`);
                        exec(`taskkill /F /PID ${pid}`, () => {});
                    }
                });
            }
            
            console.error("Ports cleared. Starting fresh nervous_system_server...");
            const server = exec('node nervous_system_server.js');
            server.stdout.on('data', data => console.error(`[SERVER] ${data.trim()}`));
            server.stderr.on('data', data => console.error(`[SERVER ERROR] ${data.trim()}`));
        });
    });
}

restartServer();
