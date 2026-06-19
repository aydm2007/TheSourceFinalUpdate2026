import fetch from 'node-fetch';

async function test() {
  const apiKey = process.env.AETHER_MCP_API_KEY || process.env.MCP_API_KEY;
  if (!apiKey) {
    console.error('Set AETHER_MCP_API_KEY or MCP_API_KEY before running this SSE flow test.');
    process.exit(1);
  }
  const hmac = (await import('node:crypto')).createHmac('sha256', apiKey).update('/mcp').digest('hex');
  const getRes = await fetch('http://localhost:3847/mcp', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'x-mcp-hmac': hmac,
      'x-project-id': 'thesource'
    }
  });
  
  if (!getRes.ok) {
    console.error('GET failed', getRes.status);
    return;
  }
  
  // Read first chunk
  const reader = getRes.body;
  let sessionId = null;
  
  reader.on('data', async (chunk) => {
    const text = chunk.toString();
    console.log('Received chunk:', text);
    
    if (text.includes('sessionId=')) {
      const match = text.match(/sessionId=([^\r\n]+)/);
      if (match) {
        sessionId = match[1].trim();
        console.log('Found session ID:', sessionId);
        
        // Now send POST
        const postRes = await fetch(`http://localhost:3847/mcp/message?sessionId=${sessionId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
          })
        });
        
        const postText = await postRes.text();
        console.log('POST Status:', postRes.status);
        console.log('POST Response:', postText);
        process.exit(0);
      }
    }
  });
}

test();
