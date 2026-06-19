/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  ✂️ Context Optimizer V1.0 — Sovereign Token Economizer           │
 * │  Post-processes tool outputs to strip comments, collapse whitespaces│
 * │  and compress large text chunks before returning to the model.    │
 * └──────────────────────────────────────────────────────────────────┘
 */

'use strict';

const commentStripper = require('../utils/comment_stripper.js');

/**
 * Optimizes the payload returned by tools to reduce token footprint.
 * @param {string} toolName - Name of the tool executed
 * @param {string} filePath - Path of the file related to the tool call
 * @param {string} rawResult - The raw text output of the tool execution
 * @returns {string} - The optimized/compressed output
 */
function optimizeToolOutput(toolName, filePath, rawResult) {
  if (!rawResult || typeof rawResult !== 'string') {
    return rawResult;
  }

  // Only optimize file-reading or search tools to keep syntax validations clean
  const OPTIMIZABLE_TOOLS = new Set(['FileRead', 'FileReadLines', 'Grep', 'Glob', 'LSPTool']);
  if (!OPTIMIZABLE_TOOLS.has(toolName)) {
    return rawResult;
  }

  try {
    // If the file is a code file, run comment stripping and newline compaction
    let optimized = commentStripper.compress(filePath || 'code.js', rawResult);

    // If it's still extremely large, summarize or collapse further
    if (optimized.length > 50000) {
      optimized = optimized.substring(0, 40000) + `\n\n... [TRUNCATED ${optimized.length - 40000} CHARACTERS BY CONTEXT OPTIMIZER] ...\n`;
    }

    return optimized;
  } catch (err) {
    // Fallback safely to original result
    return rawResult;
  }
}

module.exports = { optimizeToolOutput };
