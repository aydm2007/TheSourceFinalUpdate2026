const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SovereignLSPAgent {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.tsserver = null;
        this.seq = 0;
        this.callbacks = new Map();
        this.buffer = '';
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                const fs = require('fs');
                const path = require('path');
                
                // Prefer local typescript installation to prevent npx prompts/network access
                const localTsserverPaths = [
                    path.join(this.workspaceRoot, 'node_modules/typescript/bin/tsserver'),
                    path.join(this.workspaceRoot, 'node_modules/.bin/tsserver'),
                    path.join(this.workspaceRoot, 'node_modules/.bin/tsserver.cmd')
                ];
                
                let bin = 'npx';
                let args = ['tsserver', '--disableAutomaticTypingAcquisition'];
                let options = { cwd: this.workspaceRoot, shell: true };
                
                for (const p of localTsserverPaths) {
                    if (fs.existsSync(p)) {
                        bin = 'node';
                        args = [p, '--disableAutomaticTypingAcquisition'];
                        options = { cwd: this.workspaceRoot };
                        break;
                    }
                }

                this.tsserver = spawn(bin, args, options);

                this.tsserver.stdout.on('data', (data) => this.handleData(data));
                this.tsserver.stderr.on('data', (data) => console.error(`[LSP Error] ${data}`));
                
                this.tsserver.on('error', (err) => reject(`Failed to start tsserver: ${err}`));
                
                // Initialize the project
                setTimeout(() => resolve(true), 1000);
            } catch (e) {
                reject(e);
            }
        });
    }

    handleData(data) {
        this.buffer += data.toString();
        
        while (true) {
            const contentLengthMatch = this.buffer.match(/^Content-Length:\s*(\d+)\r?\n\r?\n/i);
            if (!contentLengthMatch) {
                const leadingWhitespace = this.buffer.match(/^\s+/);
                if (leadingWhitespace) {
                    this.buffer = this.buffer.substring(leadingWhitespace[0].length);
                    continue;
                }
                break;
            }
            
            const contentLength = parseInt(contentLengthMatch[1], 10);
            const headerLength = contentLengthMatch[0].length;
            
            if (this.buffer.length < headerLength + contentLength) {
                break; // Need more data
            }
            
            const bodyStr = this.buffer.substring(headerLength, headerLength + contentLength);
            this.buffer = this.buffer.substring(headerLength + contentLength);
            
            try {
                const msg = JSON.parse(bodyStr);
                if (msg.type === 'response' && this.callbacks.has(msg.request_seq)) {
                    this.callbacks.get(msg.request_seq)(msg);
                    this.callbacks.delete(msg.request_seq);
                }
            } catch (e) {
                console.error("[LSP Parse Error]", e, bodyStr);
            }
        }
    }

    sendRequest(command, args) {
        return new Promise((resolve, reject) => {
            if (!this.tsserver) return reject("LSP Not started");
            
            this.seq++;
            const reqSeq = this.seq;
            
            const req = JSON.stringify({
                seq: reqSeq,
                type: 'request',
                command: command,
                arguments: args
            }) + '\n';

            this.callbacks.set(reqSeq, (response) => {
                if (response.success) {
                    resolve(response.body);
                } else {
                    reject(response.message);
                }
            });

            this.tsserver.stdin.write(req);
        });
    }

    async openFile(file) {
        return this.sendRequest('open', { file: file });
    }

    async getReferences(file, line, offset) {
        return this.sendRequest('references', { file, line, offset });
    }

    async getDefinition(file, line, offset) {
        return this.sendRequest('definition', { file, line, offset });
    }

    async getSemanticDiagnostics(file) {
        return this.sendRequest('semanticDiagnosticsSync', { file });
    }

    async getNavTree(file) {
        return this.sendRequest('navtree', { file });
    }

    stop() {
        if (this.tsserver) this.tsserver.kill();
    }
}

module.exports = SovereignLSPAgent;
