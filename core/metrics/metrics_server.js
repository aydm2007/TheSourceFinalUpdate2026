const http = require('http');
http.createServer((req,res)=>{res.end('Metrics placeholder');}).listen(9090);
console.log('Metrics server running on port 9090');