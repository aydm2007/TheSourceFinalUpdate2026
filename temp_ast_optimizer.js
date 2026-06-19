// Temporary MCP AST optimizer (Node.js)
// Uses the built‑in `acorn`, `estraverse`, and `escodegen` packages (available in the sandbox).
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

function parseFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  return acorn.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
}

function removeDeadCode(ast) {
  // Remove any `if (false) { ... }` blocks
  estraverse.replace(ast, {
    enter(node) {
      if (node.type === 'IfStatement' && node.test.type === 'Literal' && node.test.value === false) {
        return { type: 'EmptyStatement' };
      }
    }
  });
  return ast;
}

function dedupeImports(ast) {
  const seen = new Map();
  const newBody = [];
  for (const stmt of ast.body) {
    if (stmt.type === 'ImportDeclaration') {
      const src = stmt.source.value;
      if (seen.has(src)) {
        // merge specifiers into the first import
        const first = seen.get(src);
        first.specifiers.push(...stmt.specifiers);
      } else {
        seen.set(src, stmt);
        newBody.push(stmt);
      }
    } else {
      newBody.push(stmt);
    }
  }
  ast.body = newBody;
  return ast;
}

function optimize(filePath) {
  const abs = path.resolve(filePath);
  const backup = abs + '.bak';
  fs.copyFileSync(abs, backup);
  let ast = parseFile(abs);
  ast = removeDeadCode(ast);
  ast = dedupeImports(ast);
  const out = escodegen.generate(ast);
  fs.writeFileSync(abs, out, 'utf8');
  console.log(JSON.stringify({status: 'ok', original: backup, optimized: abs}));
}

// CLI entry point
if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node temp_ast_optimizer.js <path-to-js-or-ts>');
    process.exit(1);
  }
  optimize(target);
}
