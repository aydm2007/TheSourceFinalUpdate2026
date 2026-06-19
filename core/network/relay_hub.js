const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');
const EphemeralKeyManager = require('../security/ephemeral_keys');

class RelayHub {
    constructor() {
        this.activeSessions = new Map(); // Map<SessionId, WebSocket>
        this.pendingRequests = new Map(); // Map<RequestId, Promise.resolve/reject>
        this.wss = null;
    }

    /**
     * Start the Relay Hub attached to an existing HTTP Server,
     * or start a new standalone one.
     */
    start(port = 3848) {
        if (this.wss) return;

        this.wss = new WebSocket.Server({ host: '0.0.0.0', port });
        
        this.wss.on('connection', (ws, req) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');

            if (!EphemeralKeyManager.validateAndConsume(token)) {
                ws.close(4001, 'Unauthorized or Expired Token');
                return;
            }

            const sessionId = `relay_${Date.now()}`;
            this.activeSessions.set(sessionId, ws);
            console.log(`[RELAY-HUB] Secure connection established. Session: ${sessionId}`);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'tool_response' && data.requestId) {
                        const pending = this.pendingRequests.get(data.requestId);
                        if (pending) {
                            if (data.error) pending.reject(new Error(data.error));
                            else pending.resolve(data.result);
                            this.pendingRequests.delete(data.requestId);
                        }
                    }
                } catch (err) {
                    console.error('[RELAY-HUB] Invalid message from client:', err);
                }
            });

            ws.on('close', () => {
                console.log(`[RELAY-HUB] Connection closed. Session: ${sessionId}`);
                this.activeSessions.delete(sessionId);
            });
        });

        console.log(`[RELAY-HUB] Sovereign Relay Tunnel listening on ws://localhost:${port}`);
    }

    /**
     * Forward an MCP tool request to the connected client relay
     */
    async executeOnClient(toolName, args, timeoutMs = 10000) {
        if (this.activeSessions.size === 0) {
            throw new Error('[SOVEREIGN-BLOCK] No active Relay tunnel connected.');
        }

        // Send to the first active session (in reality, could route by workspaceId)
        const [sessionId, ws] = this.activeSessions.entries().next().value;
        const requestId = crypto.randomUUID();

        const payload = JSON.stringify({
            type: 'tool_request',
            requestId,
            toolName,
            args
        });

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error(`[RELAY-HUB] Tool execution timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            this.pendingRequests.set(requestId, {
                resolve: (res) => { clearTimeout(timeout); resolve(res); },
                reject: (err) => { clearTimeout(timeout); reject(err); }
            });

            ws.send(payload);
        });
    }
}

// Singleton export
module.exports = new RelayHub();
