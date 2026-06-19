// aether-proxy.js — Sovereign Oracle Secure Proxy V4
const https = require('https');
const http = require('http');
const fs = require('fs');
const { RelayBridge } = require('./relay_bridge.js');
const bridge = new RelayBridge();

const PORT = 9999;

// Generate/Load dummy cert (Self-signed logic)
// For simplicity in this environment, we will try to use HTTP first but with a DIFFERENT approach.
// IF the user still sees ERR_BAD_REQUEST, it might be the VERSION header.

const server = http.createServer(async (req, res) => {
  const method = req.method.toUpperCase();
  console.error(`[Proxy] ${method} ${req.url}`);

  const headers = {
    'Content-Type': 'application/json',
    'x-anthropic-version': '2023-06-01',
    'Access-Control-Allow-Origin': '*',
    'Connection': 'close'
  };

  if (method === 'OPTIONS') {
    res.writeHead(204, headers);
    return res.end();
  }

  if (method === 'HEAD') {
    res.writeHead(200, headers);
    return res.end();
  }

  if (req.url === '/v1' || req.url === '/v1/' || req.url === '/v1/health') {
    res.writeHead(200, headers);
    return res.end(JSON.stringify({ status: 'operational' }));
  }

  if (req.url === '/v1/messages') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const params = JSON.parse(body);
        const response = await bridge.createPulse(params);
        res.writeHead(200, headers);
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(500, headers);
        res.end(JSON.stringify({ error: { message: err.message } }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.error(`[Proxy] Aether Oracle Proxy V4 active on http://127.0.0.1:${PORT}`);
});
