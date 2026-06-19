// Self-Synthesized Tool: mcp_temp_ast_parser
// Parses a JavaScript/TypeScript file, builds its AST using @babel/parser, and applies simple optimizations such as dead‑code removal and constant folding. Returns the transformed code as a string.
module.exports = module.exports = async (args, context) => {
  const { file_path } = args;
  const fs = require("fs").promises;
  const parser = require("@babel/parser");
  const traverse = require("@babel/traverse").default;
  const generate = require("@babel/generator").default;
  const t = require("@babel/types");

  // Read source file
  const code = await fs.readFile(file_path, "utf8");

  // Parse to AST
  const ast = parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript", "classProperties", "dynamicImport"],
  });

  // Simple dead‑code elimination: remove if (false) {...}
  traverse(ast, {
    IfStatement(path) {
      const test = path.get("test");
      if (test.isBooleanLiteral({ value: false })) {
        path.remove();
      }
    },
    // Constant folding for binary expressions with literals
    BinaryExpression(path) {
      const left = path.get("left");
      const right = path.get("right");
      if (left.isNumericLiteral() && right.isNumericLiteral()) {
        const result = eval(
          `${left.node.value} ${path.node.operator} ${right.node.value}`,
        );
        path.replaceWith(t.numericLiteral(result));
      }
    },
  });

  // Generate transformed code
  const output = generate(
    ast,
    {
      /* options */
    },
    code,
  );
  return { transformed_code: output.code };
};
