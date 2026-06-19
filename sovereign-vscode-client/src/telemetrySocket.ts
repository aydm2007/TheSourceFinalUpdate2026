import * as vscode from 'vscode';
import * as WebSocket from 'ws';

export class TelemetrySocket {
  private ws: WebSocket | null = null;
  
  connect() {
    const config = vscode.workspace.getConfiguration('sovereign');
    const host = config.get<string>('serverHost') || 'localhost';
    const port = config.get<number>('serverPort') || 9998;
    
    console.log(`Connecting to Sovereign Nexus Brain at ws://${host}:${port}...`);
    this.ws = new WebSocket(`ws://${host}:${port}`);
    this.ws.on('open', () => { console.log(`Connected to Sovereign Nexus Brain at ${host}:${port}.`); });
    this.ws.on('message', (data) => { console.log('Received from Nexus:', data.toString()); });
    this.ws.on('error', (err) => { console.error('Socket Error:', err); });
  }
  
  send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}
