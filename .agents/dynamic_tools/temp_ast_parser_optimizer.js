// Self-Synthesized Tool: temp_ast_parser_optimizer
// Parses a given JavaScript/TypeScript file, performs simple AST optimizations (removing dead code, consolidating imports), and writes the optimized file back.
module.exports = module.exports = async (args, context) => {
  const { file_path } = args;
  const fs = require("fs");
  const { parse } = require("@babel/parser");
  const generate = require("@babel/generator").default;
  const traverse = require("@babel/traverse").default;
  const t = require("@babel/types");

  if (!fs.existsSync(file_path)) {
    throw new Error(`File not found: ${file_path}`);
  }

  const code = fs.readFileSync(file_path, "utf8");
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript", "jsx", "classProperties", "dynamicImport"],
  });

  // Simple dead-code elimination: remove if (false) {...}
  traverse(ast, {
    IfStatement(path) {
      if (
        path.node.test.type === "BooleanLiteral" &&
        path.node.test.value === false
      ) {
        path.remove();
      }
    },
    // Consolidate duplicate import specifiers
    ImportDeclaration(path) {
      const source = path.node.source.value;
      const specifiers = path.node.specifiers.map((s) => s.local.name);
      const sibling = path.parent.body.find(
        (p) =>
          p.type === "ImportDeclaration" &&
          p.source.value === source &&
          p !== path.node,
      );
      if (sibling) {
        const siblingSpecifiers = sibling.specifiers.map((s) => s.local.name);
        const newSpecifiers = [
          ...new Set([...specifiers, ...siblingSpecifiers]),
        ];
        path.node.specifiers = newSpecifiers.map((name) =>
          t.importSpecifier(t.identifier(name), t.identifier(name)),
        );
        sibling.remove();
      }
    },
  });

  const output = generate(ast, { retainLines: true }, code);
  fs.writeFileSync(file_path, output.code, "utf8");
  return { status: "ok", optimized_file: file_path };
};
