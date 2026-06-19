// run_ast_optimize.js – executes the temporary AST optimizer on all source files
const path = require('path');
const { execSync } = require('child_process');

// Ensure required Babel packages are installed (no‑save to keep workspace clean)
execSync('npm install --no-save @babel/parser @babel/traverse @babel/generator glob', { stdio: 'inherit' });

// Load the optimizer defined in temp_ast_optimize.js
const { optimizeFile } = require('./temp_ast_optimize');

// Find all JavaScript/TypeScript source files under the src directory
const glob = require('glob');
const files = glob.sync(path.join(process.cwd(), 'src/**/*.{js,ts,jsx,tsx}'));

files.forEach(f => {
  try {
    optimizeFile(f);
  } catch (e) {
    console.error(`Failed to optimize ${f}:`, e);
  }
});

console.log('AST optimization pass completed.');