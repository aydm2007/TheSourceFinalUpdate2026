/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  🛡️ AST Guardian V1.0 — Sovereign Syntax Integrity Guard         │
 * │  Pre-validates code syntax before writing or editing files      │
 * │  Supports JS (via VM compiler), JSON, and basic Python checks   │
 * └──────────────────────────────────────────────────────────────────┘
 */

'use strict';

const vm = require('vm');
const path = require('path');

/**
 * Validates the syntax of the content based on the file extension.
 * @param {string} filePath - Path of the file being written/edited
 * @param {string} content - The code content to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateContent(filePath, content) {
  if (!content) return { valid: true };
  
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
      // Validate JavaScript syntax using Node.js native VM compilation
      // This is extremely fast and requires 0 dependencies.
      new vm.Script(content, { filename: path.basename(filePath), displayErrors: true });
    } else if (ext === '.json') {
      JSON.parse(content);
    } else if (ext === '.py') {
      // Python syntax check using simple indent/parenthesis/brackets parity checks
      // and checking for obvious trailing colons on blocks.
      checkPythonSyntax(content);
    }
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: `[AST Guardian Syntax Violation] In file '${path.basename(filePath)}': ${err.message}`
    };
  }
}

/**
 * Basic Python brackets parity and block colon validation helper
 */
function checkPythonSyntax(code) {
  const lines = code.split('\n');
  const stack = [];
  const matching = { ')': '(', '}': '{', ']': '[' };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Simple bracket validation
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (['(', '{', '['].includes(char)) {
        stack.push({ char, line: i + 1 });
      } else if ([')', '}', ']'].includes(char)) {
        if (stack.length === 0) {
          throw new Error(`Mismatched bracket '${char}' on line ${i + 1}`);
        }
        const last = stack.pop();
        if (last.char !== matching[char]) {
          throw new Error(`Mismatched bracket: opened '${last.char}' on line ${last.line}, closed '${char}' on line ${i + 1}`);
        }
      }
    }

    // Basic python block syntax helper: 'def ', 'class ', 'if ', 'elif ', 'else:', 'for ', 'while ', 'try:', 'except'
    // should end with a colon.
    const controlKeywords = [/^(def\s+|class\s+|if\s+|elif\s+|for\s+|while\s+)/, /^(else:|try:|except(\s+.*)?:|finally:)/];
    const isControl = controlKeywords.some(rx => rx.test(line));
    if (isControl && !line.endsWith(':') && !line.includes('#')) {
      throw new Error(`Missing colon ':' at the end of block statement on line ${i + 1}: "${line}"`);
    }
  }
  
  if (stack.length > 0) {
    const unclosed = stack.pop();
    throw new Error(`Unclosed bracket '${unclosed.char}' opened on line ${unclosed.line}`);
  }
}

module.exports = { validateContent };
