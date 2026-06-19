const fs = require("fs");
const path = require("path");

// AST Auto-Patching Engine for Sovereign V17.0
// Uses Babel to surgically modify code without breaking indentation or syntax.
class ASTAutoPatch {
  constructor() {
    try {
      this.parser = require("@babel/parser");
      this.traverse = require("@babel/traverse").default;
      this.generate = require("@babel/generator").default;
    } catch (e) {
      console.warn(
        "[ASTAutoPatch] Babel is not fully installed. Running in heuristic fallback mode.",
      );
      this.fallbackMode = true;
    }
  }

  async patchFunction(filePath, functionName, newBodyStr) {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath))
      throw new Error(`File not found: ${fullPath}`);

    const code = fs.readFileSync(fullPath, "utf8");

    if (this.fallbackMode) {
      return this._heuristicPatch(fullPath, code, functionName, newBodyStr);
    }

    try {
      const ast = this.parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy"],
      });

      const self = this;
      let patched = false;

      this.traverse(ast, {
        FunctionDeclaration(path) {
          if (path.node.id && path.node.id.name === functionName) {
            // Wrap the new body string in a function to parse it properly into a BlockStatement
            const wrappedBody = `function temp() { ${newBodyStr} }`;
            const newBodyAst = self.parser.parse(wrappedBody, {
              sourceType: "module",
              plugins: ["typescript", "jsx", "decorators-legacy"],
            });

            // Extract the BlockStatement (the body of the temp function)
            const newBlockStatement = newBodyAst.program.body[0].body;

            // Replace the old body with the new BlockStatement
            path.get("body").replaceWith(newBlockStatement);
            patched = true;
          }
        },
      });

      if (!patched)
        throw new Error(`Function ${functionName} not found in AST.`);

      const output = this.generate(ast, { retainLines: true }, code);
      fs.writeFileSync(fullPath, output.code, "utf8");
      return `[SUCCESS] AST successfully patched function ${functionName} in ${filePath}`;
    } catch (e) {
      console.error(`[ASTAutoPatch] AST Parsing failed: ${e.message}`);
      return this._heuristicPatch(fullPath, code, functionName, newBodyStr);
    }
  }

  _heuristicPatch(fullPath, code, functionName, newBodyStr) {
    // Fallback if Babel fails
    console.log(
      `[ASTAutoPatch] Falling back to regex heuristic for ${functionName}`,
    );
    const regex = new RegExp(
      `(function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{)[^}]*(\\})`,
      "g",
    );
    const newCode = code.replace(regex, `$1\n    ${newBodyStr}\n$2`);
    if (code === newCode)
      throw new Error(`Function ${functionName} not found by heuristic.`);
    fs.writeFileSync(fullPath, newCode, "utf8");
    return `[SUCCESS] Heuristic patched function ${functionName} in ${fullPath}`;
  }
}

module.exports = ASTAutoPatch;

// CLI execution for direct MCP calls
if (require.main === module) {
  const [, , filePath, functionName, newBody] = process.argv;
  if (!filePath || !functionName) {
    console.log(
      "Usage: node ASTAutoPatch.js <filePath> <functionName> <newBody>",
    );
    process.exit(1);
  }
  const patcher = new ASTAutoPatch();
  patcher
    .patchFunction(filePath, functionName, newBody)
    .then(console.log)
    .catch((e) => console.error(e.message));
}
