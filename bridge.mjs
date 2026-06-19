import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import process from "process";
import * as readline from "readline";
import crypto from "crypto";
import "dotenv/config";

const API_KEY = process.env.MCP_API_KEY;

// 1. المطابقة الجراحية للتشفير: السيرفر يقوم بتشفير المسار "/mcp" فقط
const payloadToSign = "/mcp";
const clientHmac = crypto.createHmac('sha256', API_KEY).update(payloadToSign).digest('hex');

// 2. المطابقة في الرابط: السيرفر يبحث عن المتغير "hmac="
const SERVER_URL = `http://127.0.0.1:3847/mcp?hmac=${clientHmac}`;

const stderrWrite = process.stderr.write.bind(process.stderr);
console.log = (...args) => stderrWrite("[BRIDGE] " + args.join(' ') + '\n');
console.error = (...args) => stderrWrite("[ERROR] " + args.join(' ') + '\n');

async function runBridge() {
  const transport = new SSEClientTransport(new URL(SERVER_URL), {
    requestInit: {
      headers: {
        // 3. المطابقة في الهيدر: السيرفر يبحث عن "x-mcp-hmac"
        "x-mcp-hmac": clientHmac,
        "x-mcp-key": API_KEY,
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  });

  try {
    await transport.start();
    console.log("Bridge connected successfully to MCP Server");
  } catch (e) {
    console.error("Connection failed with status 401/403.", e);
    process.exit(1);
  }

  transport.onmessage = (message) => {
    process.stdout.write(JSON.stringify(message) + "\n");
  };

  transport.onerror = (error) => {
    console.error("SSE Error:", error);
  };

  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
  });

  rl.on("line", (line) => {
    if (!line.trim()) return;
    try {
      const message = JSON.parse(line);
      transport.send(message);
    } catch (err) {
      console.error("Failed to parse local message:", err);
    }
  });
}

runBridge().catch(err => {
  console.error("Critical failure:", err);
  process.exit(1);
});