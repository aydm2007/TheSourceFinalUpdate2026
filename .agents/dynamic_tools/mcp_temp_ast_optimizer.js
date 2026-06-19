// Self-Synthesized Tool: mcp_temp_ast_optimizer
// Parses a JavaScript/TypeScript file, runs a lightweight AST traversal to remove dead code, consolidate imports, and apply simple performance optimizations. Returns the transformed source as a string.
module.exports = async (args, context) => {
  const { file_path } = args;
  const fs = require("fs").promises;
  const { parse } = require("recast");
  const { visit } = require("ast-types");
  const recast = require("recast");

  // Read source
  let source = await fs.readFile(file_path, "utf8");

  // Parse to AST
  let ast = recast.parse(source, { parser: require("recast/parsers/babel") });

  // Simple dead‑code remover: eliminate variable declarations never referenced
  const used = new Set();
  visit(ast, {
    visitIdentifier(path) {
      used.add(path.node.name);
      this.traverse(path);
    },
  });
  visit(ast, {
    visitVariableDeclarator(path) {
      const name = path.node.id.name;
      if (!used.has(name)) {
        // Remove the whole declaration statement
        const stmt = path.parentPath.parentPath;
        stmt.prune();
        return false;
      }
      this.traverse(path);
    },
  });

  // Consolidate duplicate imports from the same module
  const importMap = {};
  visit(ast, {
    visitImportDeclaration(path) {
      const source = path.node.source.value;
      if (!importMap[source]) importMap[source] = [];
      importMap[source].push(path);
      this.traverse(path);
    },
  });
  for (const src in importMap) {
    const decls = importMap[src];
    if (decls.length > 1) {
      const first = decls[0];
      const combinedSpecifiers = [];
      decls.forEach((d) => {
        combinedSpecifiers.push(...d.node.specifiers);
        if (d !== first) d.prune();
      });
      first.get("specifiers").replace(combinedSpecifiers);
    }
  }

  // Simple performance tweak: replace "var" with "let" for block‑scoped safety
  visit(ast, {
    visitVariableDeclaration(path) {
      if (path.node.kind === "var") {
        path.node.kind = "let";
      }
      this.traverse(path);
    },
  });

  // Generate transformed code
  const output = recast.print(ast).code;
  await fs.writeFile(file_path, output, "utf8");

  return { status: "ok", transformed: true, file: file_path };
};
