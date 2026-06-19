const fs = require('fs');
const engineContent = fs.readFileSync('C:/tools/workspace/TheSource/core/security/sovereign_engine.js', 'utf8');
console.error('Requires nexus_bridge:', engineContent.includes('nexus_bridge'));
