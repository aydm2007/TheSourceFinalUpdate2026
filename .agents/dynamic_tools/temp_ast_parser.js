// Self-Synthesized Tool: temp_ast_parser
// Temporary MCP tool that reads a source file, parses it with @babel/parser, and returns a JSON summary of the AST node count, depth, and list of import/export statements for file-level parsing and AST optimization purposes.
module.exports = const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

/**
 * Parses a JavaScript/TypeScript file and returns AST metrics.
 * @param {{file_path:string}} args
 * @returns {{nodeCount:number, maxDepth:number, imports:string[], exports:string[]}}
 */
module.exports = async function(args) {
  const { file_path } = args;
  if (!file_path) throw new Error('file_path is required');
  const absolutePath = path.resolve(file_path);
  const code = await fs.promises.readFile(absolutePath, 'utf8');

  const ast = parser.parse(code, {
    sourceType: 'unambiguous',
    plugins: ['typescript', 'jsx', 'classProperties', 'dynamicImport']
  });

  let nodeCount = 0;
  let maxDepth = 0;
  const imports = [];
  const exports = [];

  function traverse(node, depth) {
    nodeCount++;
    if (depth > maxDepth) maxDepth = depth;
    if (node.type === 'ImportDeclaration') {
      imports.push(node.source.value);
    }
    if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
      if (node.source && node.source.value) {
        exports.push(node.source.value);
      } else if (node.declaration && node.declaration.id) {
        exports.push(node.declaration.id.name);
      }
    }
    for (const key in node) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => c && typeof c.type === 'string' && traverse(c, depth + 1));
      } else if (child && typeof child.type === 'string') {
        traverse(child, depth + 1);
      }
    }
  }

  traverse(ast.program, 0);

  return { nodeCount, maxDepth, imports, exports };
};;