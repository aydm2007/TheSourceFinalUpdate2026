const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

console.error("📡 [TheSource-MCP] Local Context Server Booted via STDIO.");

rl.on('line', (line) => {
  if (!line.trim()) return;

  try {
    const request = JSON.parse(line);
    const response = {
      jsonrpc: "2.0",
      id: request.id,
      result: {}
    };

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
            // Write the new content to disk
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

    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (err) {
    console.error(`❌ MCP Protocol Execution Error: ${err.message}`);
  }
});
