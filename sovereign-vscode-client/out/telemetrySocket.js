"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetrySocket = void 0;
const vscode = require("vscode");
const WebSocket = require("ws");
class TelemetrySocket {
    constructor() {
        this.ws = null;
    }
    connect() {
        const config = vscode.workspace.getConfiguration('sovereign');
        const host = config.get('serverHost') || 'localhost';
        const port = config.get('serverPort') || 9998;
        console.log(`Connecting to Sovereign Nexus Brain at ws://${host}:${port}...`);
        this.ws = new WebSocket(`ws://${host}:${port}`);
        this.ws.on('open', () => { console.log(`Connected to Sovereign Nexus Brain at ${host}:${port}.`); });
        this.ws.on('message', (data) => { console.log('Received from Nexus:', data.toString()); });
        this.ws.on('error', (err) => { console.error('Socket Error:', err); });
    }
    send(payload) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }
}
exports.TelemetrySocket = TelemetrySocket;
//# sourceMappingURL=telemetrySocket.js.map