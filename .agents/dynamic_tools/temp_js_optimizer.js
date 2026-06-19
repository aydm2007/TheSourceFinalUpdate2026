// Self-Synthesized Tool: temp_js_optimizer
// Temporary JavaScript AST optimizer that removes console.log statements and unused import declarations, then writes the transformed code back to the original file.
module.exports = const fs = require('fs').promises;
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

module.exports = async function(args) {
  const filePath = args.file_path;
  const code = await fs.readFile(filePath, 'utf8');
  const ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'classProperties'] });

  // Remove console.log statements
  traverse(ast, {
    ExpressionStatement(path) {
      const expr = path.node.expression;
      if (
        expr.type === 'CallExpression' &&
        expr.callee.type === 'MemberExpression' &&
        expr.callee.object.name === 'console' &&
        expr.callee.property.name === 'log'
      ) {
        path.remove();
      }
    }
  });

  // Simple heuristic to drop import declarations with no specifiers used elsewhere
  const usedIdentifiers = new Set();
  traverse(ast, {
    Identifier(path) {
      usedIdentifiers.add(path.node.name);
    }
  });
  traverse(ast, {
    ImportDeclaration(path) {
      const specifiers = path.node.specifiers;
      if (specifiers.length === 0) return; // side‑effect import, keep it
      const allUnused = specifiers.every(s => !usedIdentifiers.has(s.local.name));
      if (allUnused) path.remove();
    }
  });

  const output = generate(ast, { /* options */ }, code);
  await fs.writeFile(filePath, output.code, 'utf8');
  return { status: 'ok', message: 'AST optimization applied', file: filePath };
};;