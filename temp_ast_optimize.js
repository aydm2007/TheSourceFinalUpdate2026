const { execSync } = require('child_process');
// Install required Babel packages locally (no‑save to avoid polluting package.json)
execSync('npm install --no-save @babel/parser @babel/traverse @babel/generator', { stdio: 'inherit' });
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

function optimizeFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  traverse(ast, {
    CallExpression(path) {
      const callee = path.get('callee');
      if (callee.isMemberExpression() && callee.get('object').isIdentifier({ name: 'console' }) && callee.get('property').isIdentifier({ name: 'log' })) {
        path.remove();
      }
    }
  });
  const { code: optimized } = generate(ast);
  fs.writeFileSync(filePath, optimized, 'utf8');
  console.log(`Optimized ${filePath}`);
}

// Export for external use
module.exports = { optimizeFile };