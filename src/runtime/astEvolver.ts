import * as ts from 'typescript';

/**
 * AETHER-ZENITH V39.0-APEX - AST EVOLVER & STRUCTURAL INTEGRITY VALIDATOR
 * Upgraded to Aether V39.0-Apex Post-Agent Runtime Architecture (Persistent Adaptive Cognitive Substrates) with 105 Modules.
 * Enforces Constitutional Policies, Sandbox limits, Causal checks, Semantic Security, Philosophical Boundaries, and Self-Preservation at AST level.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates TypeScript code using the official TypeScript Compiler API.
 * Ensures the code has NO syntax errors, structural flaws, natural language leakages,
 * sandbox violations, causal lineage disruptions, semantic security failures, philosophical boundary violations, or self-preservation bypasses.
 */
export function validateTypeScriptSyntax(code: string, fileName: string = 'temp.ts'): ValidationResult {
  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true, // setParentNodes
    ts.ScriptKind.TS
  );

  const errors: string[] = [];
  const isToolDispatcher = fileName.includes('LegacyToolDispatcher.ts');

    // Recursive AST walk to find syntax errors, anomalies, and sandboxing safety violations
    function walk(node: ts.Node) {
      const parsedNode = node as ts.Node & { parseDiagnostics?: ts.Diagnostic[] };
      if (node.kind === ts.SyntaxKind.Unknown || (parsedNode.parseDiagnostics !== undefined && (parsedNode.parseDiagnostics?.length ?? 0) > 0)) {
        errors.push(`Syntax error near node kind ${node.kind}`);
      }

    // 14. Capability Sandboxing & 42. Semantic Security Layer check & 102. Self-Preserving Intelligence
    if (ts.isIdentifier(node)) {
      const text = node.text;
      
      // Sandbox: Banned identifiers
      if (text === 'eval') {
        errors.push("Sandbox Violation: Use of 'eval()' is strictly banned.");
      }
      
      // Constitutional Policy Tampering Prevention
      if (text === 'constitutionalRules' || text === 'constitutional_policy') {
        errors.push("Constitutional Violation: Mutation of constitutional policy files or arrays is prohibited.");
      }

      // Module 93: Philosophical Boundaries Tampering Prevention
      if (text === 'philosophicalBoundaries') {
        errors.push("Philosophical Boundary Violation: Mutation of absolute philosophical reasoning limits is strictly prohibited.");
      }

      // Module 102: Self-Preservation Variable Tampering Prevention
      if (text === 'assertSelfPreservationInstinct') {
        const parent = node.parent;
        if (parent && (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && parent.left === node)) {
          errors.push("Self-Preservation Violation: Mutation of absolute self-preservation checking function is strictly prohibited.");
        }
      }

      // Semantic Security: Check for backdoor identifiers
      if (text === 'exec' || text === 'execSync' || text === 'spawn' || text === 'spawnSync') {
        if (!isToolDispatcher) {
          errors.push(`Semantic Security Violation: Dangerous subprocess execution method '${text}' is blocked.`);
        }
      }

      // Causal validation: Block attempts to dynamically bypass the Causal Reasoning Engine
      if (text === 'buildCausalGraph' || text === 'checkRecursiveStability') {
        // Enforce readonly status of causal structures
        const parent = node.parent;
        if (parent && (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && parent.left === node)) {
          errors.push(`Causal Stability Violation: Overriding critical causal safety function '${text}' is prohibited.`);
        }
      }
      
      // Heuristic: Arabic characters or conversational tokens leaked as identifiers
      if (/[\u0600-\u06FF]/.test(text)) {
        errors.push(`Illegal identifier containing Arabic text: "${text}"`);
      }
      if (/^(here|is|the|corrected|please|sure|sorry|apologies|عذراً|لايمكنني)$/i.test(text)) {
        errors.push(`Conversational token leaked into identifier: "${text}"`);
      }
    }

    // Block unsafe imports / module loading (Semantic Security)
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        const restricted = ['child_process', 'cluster', 'vm', 'fs/promises', 'dns', 'http', 'https', 'net', 'tls'];
        if (restricted.some(r => importPath === r || importPath.startsWith(r))) {
          if (!(isToolDispatcher && (importPath === 'child_process' || importPath === 'fs/promises'))) {
            errors.push(`Sandbox Violation: Importing module '${importPath}' is restricted under constitutional sandbox policies.`);
          }
        }
      }
    }

    // Block dynamic function creations that bypass compilation
    if (ts.isNewExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression) && expression.text === 'Function') {
        errors.push("Sandbox Violation: Use of dynamic Function constructor is strictly banned.");
      }
    }

    ts.forEachChild(node, walk);
  }

  walk(sourceFile);

  // Validate structural integrity: ensure there are actual TS declarations
  let hasDeclarations = false;
  ts.forEachChild(sourceFile, (node) => {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isVariableStatement(node) ||
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node) ||
      ts.isExportAssignment(node) ||
      ts.isModuleDeclaration(node)
    ) {
      hasDeclarations = true;
    }
  });

  if (!hasDeclarations && code.trim().length > 0) {
    errors.push("No valid TypeScript structural declarations found.");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Compares two ASTs to ensure critical exports (named, default, and type exports) are not lost.
 */
export function compareExports(originalCode: string, newCode: string): { safe: boolean; missingExports: string[] } {
  const getExports = (code: string) => {
    const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);
    const exports: string[] = [];
    
    ts.forEachChild(sourceFile, (node) => {
      // Named Exports
      if (ts.canHaveModifiers(node)) {
        const modifiers = ts.getModifiers(node);
        const hasExport = modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
        if (hasExport) {
          if (ts.isFunctionDeclaration(node) && node.name) {
            exports.push(node.name.text);
          } else if (ts.isClassDeclaration(node) && node.name) {
            exports.push(node.name.text);
          } else if (ts.isInterfaceDeclaration(node) && node.name) {
            exports.push(node.name.text);
          } else if (ts.isTypeAliasDeclaration(node) && node.name) {
            exports.push(node.name.text);
          } else if (ts.isVariableStatement(node)) {
            node.declarationList.declarations.forEach(d => {
              if (ts.isIdentifier(d.name)) exports.push(d.name.text);
            });
          }
        }
      }

      // Default Exports
      if (ts.isExportAssignment(node)) {
        exports.push("default");
      }

      // Export Declarations
      if (ts.isExportDeclaration(node) && node.exportClause) {
        if (ts.isNamedExports(node.exportClause)) {
          node.exportClause.elements.forEach(el => {
            exports.push(el.name.text);
          });
        }
      }
    });

    return exports;
  };

  const origExports = getExports(originalCode);
  const newExports = getExports(newCode);

  const missingExports = origExports.filter(e => !newExports.includes(e));

  return {
    safe: missingExports.length === 0,
    missingExports
  };
}
