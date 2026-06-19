// src/core-engine/IPCHub.js
// AETHER-ZENITH V33.1 - SOVEREIGN IPC HUB
// Bidirectional IPC Socket for real-time telemetry and control.

const net = require("net");

class IPCHub {
  constructor() {
    this.port = process.env.AETHER_IPC_PORT || 15015;
    this.clients = new Set();
    this.server = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    this.server = net.createServer((socket) => {
      console.log(
        `[IPC Hub] Client connected: ${socket.remoteAddress}:${socket.remotePort}`,
      );
      this.clients.add(socket);

      socket.on("data", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(message, socket);
        } catch (err) {
          console.warn("[IPC Hub] Received invalid message from client.");
        }
      });

      socket.on("end", () => {
        console.log(
          `[IPC Hub] Client disconnected: ${socket.remoteAddress}:${socket.remotePort}`,
        );
        this.clients.delete(socket);
      });

      socket.on("error", (err) => {
        console.warn(`[IPC Hub] Socket error: ${err.message}`);
        this.clients.delete(socket);
      });
    });

    this.server.on("error", (err) => {
      console.error(`[IPC Hub] Server error: ${err.message}`);
    });

    this.server.listen(this.port, "127.0.0.1", () => {
      console.log(
        `[IPC Hub] Sovereign Telemetry Active on 127.0.0.1:${this.port}`,
      );
      this.isRunning = true;
    });
  }

  handleClientMessage(message, socket) {
    // Reserved for future: receiving commands from the VSCode extension.
    // E.g., { command: 'STOP_AGENT', agentId: '...' }
    console.log(`[IPC Hub] Received command:`, message);
  }

  broadcast(event) {
    if (!this.isRunning || this.clients.size === 0) return;

    const payload =
      JSON.stringify({
        timestamp: new Date().toISOString(),
        ...event,
      }) + "\n";

    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }
}

// Export as a singleton
const ipcHub = new IPCHub();
module.exports = ipcHub;
