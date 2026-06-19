// Self-Synthesized Tool: temp_ast_optimizer
// Temporary MCP tool for parsing a given source file and applying basic AST optimizations such as removing unused imports and consolidating duplicate variable declarations.
module.exports = async (args, context) => {
  const { file_path } = args;
  const fs = require("fs").promises;
  const { parse } = require("@babel/parser");
  const generate = require("@babel/generator").default;
  const traverse = require("@babel/traverse").default;

  // Read file content
  const code = await fs.readFile(file_path, "utf8");

  // Parse to AST
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  // Track imported identifiers
  const usedIdentifiers = new Set();
  const importDeclarations = [];

  // First pass: collect used identifiers
  traverse(ast, {
    Identifier(path) {
      usedIdentifiers.add(path.node.name);
    },
  });

  // Second pass: remove unused imports and duplicate variable declarations
  traverse(ast, {
    ImportDeclaration(path) {
      importDeclarations.push(path);
      const specifiers = path.node.specifiers.filter((spec) =>
        usedIdentifiers.has(spec.local.name),
      );
      if (specifiers.length === 0) {
        path.remove();
      } else if (specifiers.length !== path.node.specifiers.length) {
        path.node.specifiers = specifiers;
      }
    },
    VariableDeclaration(path) {
      // Remove duplicate variable declarators with same identifier
      const seen = new Set();
      const declarations = path.node.declarations.filter((decl) => {
        const name = decl.id.name;
        if (seen.has(name)) {
          return false; // duplicate, drop it
        }
        seen.add(name);
        return true;
      });
      if (declarations.length !== path.node.declarations.length) {
        path.node.declarations = declarations;
      }
    },
  });

  // Generate optimized code
  const output = generate(
    ast,
    {
      /* options */
    },
    code,
  );

  // Write back to file
  await fs.writeFile(file_path, output.code, "utf8");

  return { status: "ok", message: `AST optimizations applied to ${file_path}` };
};
