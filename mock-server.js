const http = require('http');
const fs = require('fs');
const PORT = 8001;
const LOG = 'chat.log';
const server = http.createServer((req, res) => {
  if (req.url === '/mock-chat' && (req.method === 'GET' || req.method === 'POST')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let reply = { reply: 'مرحبا! كيف يمكنني مساعدتك اليوم؟', audioUrl: null, attachmentUrl: null };
      try {
        const data = JSON.parse(body || '{}');
        if (data.message) {
          reply.reply = `لقد قلت: ${data.message}`;
        }
      } catch(e) {}
      fs.appendFileSync(LOG, `User: ${JSON.parse(body || '{}').message || ''}\nBot: ${reply.reply}\n---\n`);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
      res.end(JSON.stringify(reply));
    });
  } else if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});
server.listen(PORT, () => console.log('Mock chat server listening on', PORT));