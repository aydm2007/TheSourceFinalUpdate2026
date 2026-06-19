/**
 * JS Surgical Engine — Sovereign Sigma V16.0 (Aether-Zenith Upgrade)
 * ------------------------------------------------------------------
 * المكون الفيزيائي المسؤول عن محاكاة حقن الشفرات البرمجية قبل الكتابة الفعلية.
 * المسار: core/services/surgical_engine/js_surgeon.js
 */
const recast = require('recast');
const { builders: b } = recast.types;
const fs = require('fs');
const path = require('path');

class JSSurgicalEngine {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.virtualCache = new Map();
  }

  loadToSandbox(relativeFilePath) {
    const absolutePath = path.resolve(this.workspaceRoot, relativeFilePath);
    if (!fs.existsSync(absolutePath)) {
        return { success: false, message: `File not found: ${absolutePath}` };
    }
    const sourceCode = fs.readFileSync(absolutePath, 'utf-8');
    try {
        const ast = recast.parse(sourceCode, {
            parser: require("recast/parsers/babel")
        });
        this.virtualCache.set(relativeFilePath, { ast, originalCode: sourceCode, modified: false });
        return { success: true };
    } catch (e) {
        return { success: false, message: `AST Parse Error: ${e.message}` };
    }
  }

  simulateMethodPatch(relativeFilePath, className, methodName, newMethodBodyCode) {
    const fileData = this.virtualCache.get(relativeFilePath);
    if (!fileData) return { success: false, message: "File not in sandbox." };

    let methodFound = false;
    const newBody = recast.parse(newMethodBodyCode, {
        parser: require("recast/parsers/babel")
    }).program.body;
    const newBlock = b.blockStatement(newBody);

    recast.visit(fileData.ast, {
      visitClassDeclaration(path) {
        if (path.node.id && path.node.id.name === className) {
          this.traverse(path);
        }
        return false;
      },
      visitMethodDefinition(path) {
        if (path.node.key && (path.node.key.name === methodName || path.node.key.value === methodName)) {
          path.node.value.body = newBlock;
          methodFound = true;
        }
        return false;
      },
      visitClassMethod(path) {
        if (path.node.key && (path.node.key.name === methodName || path.node.key.value === methodName)) {
          path.node.body = newBlock;
          methodFound = true;
        }
        return false;
      },
      visitFunctionDeclaration(path) {
        if (path.node.id && path.node.id.name === methodName) {
          path.node.body = newBlock;
          methodFound = true;
          return false;
        }
        this.traverse(path);
      },
      visitVariableDeclarator(path) {
        if (path.node.id && path.node.id.name === methodName) {
          let init = path.node.init;
          if (init && init.type === 'CallExpression' && 
             (init.callee.name === 'useCallback' || init.callee.name === 'useMemo') &&
             init.arguments.length > 0) {
            init = init.arguments[0];
          }

          if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
            init.body = newBlock;
            methodFound = true;
            return false;
          }
        }
        this.traverse(path);
      }
    });

    if (methodFound) {
      fileData.modified = true;
      return { success: true };
    }
    return { success: false, message: `Component/Method ${methodName} not found.` };
  }

  calculateBlastRadius(relativeFilePath) {
    const fileData = this.virtualCache.get(relativeFilePath);
    if (!fileData || !fileData.modified) return { riskScore: 0, affectedNodes: [] };

    const simulatedCode = recast.print(fileData.ast).code;
    const affectedNodes = [];
    
    // محرك استدلالي لنطاق التأثير (Heuristic Blast Analysis)
    const indicators = [
      { key: 'SyncApiService', node: 'Synchronization Bridge Layer' },
      { key: 'useSettings', node: 'Global State Context' },
      { key: 'Decimal', node: 'Financial GRP Core' },
      { key: 'useEffect', node: 'Lifecycle Side Effects' }
    ];

    indicators.forEach(ind => {
      if (simulatedCode.includes(ind.key)) affectedNodes.push(ind.node);
    });

    const riskScore = Math.min(affectedNodes.length * 0.25, 1.0);
    return {
      riskScore,
      affectedNodes,
      action: riskScore > 0.75 ? "BLOCK_AND_DEBATE" : "PROCEED"
    };
  }

  getOutput(relativeFilePath) {
    const fileData = this.virtualCache.get(relativeFilePath);
    return fileData ? recast.print(fileData.ast).code : null;
  }
}

// CLI Entry Point
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error(JSON.stringify({ error: "Usage: node js_surgeon.js <file_path> <class> <method> '<body>'" }));
        process.exit(1);
    }

    const [filePath, className, methodName, body] = args;
    const engine = new JSSurgicalEngine(process.cwd());
    
    const loadResult = engine.loadToSandbox(filePath);
    if (!loadResult.success) {
        console.error(JSON.stringify(loadResult));
        process.exit(1);
    }

    const patchResult = engine.simulateMethodPatch(filePath, className, methodName, body);
    if (!patchResult.success) {
        console.error(JSON.stringify(patchResult));
        process.exit(1);
    }

    const blast = engine.calculateBlastRadius(filePath);
    console.error(JSON.stringify({
        success: true,
        blast,
        preview: engine.getOutput(filePath).substring(0, 500) + "..."
    }, null, 2));
}

module.exports = JSSurgicalEngine;
