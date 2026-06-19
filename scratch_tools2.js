const { SECURITY_TOOLS, registerTools } = require('./core/security/tools_integrator.js');
let count = 0;
registerTools({
  registerTool: (name) => {
    count++;
    console.error('Registered:', name);
  }
});
console.error('Total registered:', count);
