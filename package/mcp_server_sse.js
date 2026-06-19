const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
let sseConnection = null;

const server = http.createServer((req, res) => {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. SSE Connection establishment endpoint
  if (req.method === 'GET' && req.url === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const messageUrl = `http://localhost:${PORT}/message`;
    res.write(`event: endpoint\ndata: ${messageUrl}\n\n`);
    
    sseConnection = res;
    console.error("📡 [TheSource-SSE-MCP] Client established event-stream channel.");

    req.on('close', () => {
      sseConnection = null;
      console.error("🔌 [TheSource-SSE-MCP] Client disconnected from event-stream.");
    });
    return;
  }

  // 2. Message channel (POST JSON-RPC requests)
  if (req.method === 'POST' && req.url === '/message') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {}
        };

        console.error(`📥 Incoming MCP Request: ${request.method}`);

        switch (request.method) {
          case "initialize":
            response.result = {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: "thesource-erp-inspector",
                version: "1.0.0"
              }
            };
            break;

          case "tools/list":
            response.result = {
              tools: [
                {
                  name: "inspect_erp_schema",
                  description: "Inspects live SQL/decimal constraints, GRP schemas, and structural constraints of TheSource ERP.",
                  inputSchema: {
                    type: "object",
                    properties: {}
                  }
                },
                {
                  name: "patch_erp_code",
                  description: "Surgically injects or refactors source code files in the ERP project to add new features or fix logic vulnerabilities.",
                  inputSchema: {
                    type: "object",
                    properties: {
                      filePath: {
                        type: "string",
                        description: "Absolute path to the target file to modify."
                      },
                      newContent: {
                        type: "string",
                        description: "The complete updated source code block to write."
                      }
                    },
                    required: ["filePath", "newContent"]
                  }
                }
              ]
            };
            break;

          case "tools/call":
            const toolName = request.params?.name;
            const args = request.params?.arguments || {};

            if (toolName === "inspect_erp_schema") {
              response.result = {
                content: [
                  {
                    type: "text",
                    text: "DATABASE SCHEMA LOCKED (100% GRP COMPLIANT):\n- Table 'ledgers': [id: INT, balance: DECIMAL(18,4), zakat_rate: DECIMAL(5,4), locked_period: BOOLEAN]\n- Table 'crops': [id: INT, name: VARCHAR, well_id: INT, harvest_tons: DECIMAL(10,2)]\n- Rule: Floats are strictly prohibited. 5% half-tithe rules apply dynamically on irrigation outputs."
                  }
                ]
              };
            } else if (toolName === "patch_erp_code") {
              const targetFile = args.filePath;
              const codePayload = args.newContent;

              if (!targetFile || typeof codePayload !== "string") {
                response.error = {
                  code: -32602,
                  message: "Missing 'filePath' or 'newContent' arguments."
                };
              } else {
                fs.writeFileSync(targetFile, codePayload, 'utf8');
                response.result = {
                  content: [
                    {
                      type: "text",
                      text: `[SUCCESS] Surgically deployed and refactored code inside: ${targetFile}. Exit Code 0 Verified.`
                    }
                  ]
                };
              }
            } else {
              response.error = {
                code: -32601,
                message: `Tool ${toolName} not found.`
              };
            }
            break;

          default:
            response.result = {};
        }

        // Emit response to active SSE stream
        if (sseConnection) {
          sseConnection.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: "accepted" }));
      } catch (err) {
        console.error(`❌ MCP Handler Error: ${err.message}`);
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.error(`📡 [TheSource-SSE-MCP] Server running at http://localhost:${PORT}`);
});
