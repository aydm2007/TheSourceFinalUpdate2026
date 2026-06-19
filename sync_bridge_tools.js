const fs = require('fs');
const { SECURITY_TOOLS } = require('./core/security/tools_integrator.js');
const bridgeConfigPath = './bridge.json';
const config = JSON.parse(fs.readFileSync(bridgeConfigPath, 'utf8'));

Object.keys(SECURITY_TOOLS).forEach(tool => {
  if (!config.allowed_tools.includes(tool)) {
    config.allowed_tools.push(tool);
  }
});

fs.writeFileSync(bridgeConfigPath, JSON.stringify(config, null, 2));
console.error('Successfully updated bridge.json allowed_tools!');
