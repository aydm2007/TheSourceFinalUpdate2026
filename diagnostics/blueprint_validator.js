// blueprint_validator.js – ensures an Implementation Plan exists before writes
// ---------------------------------------------------------------
// This module is intended to be used by the Nexus bridge or any
// internal file‑write wrapper. It throws if `Implementation_Plan.md`
// is missing, preventing uncontrolled modifications.

const fs = require('fs');
const path = require('path');

/**
 * Validate that the repository contains an Implementation_Plan.md file.
 * If the file does not exist, an Error is thrown to abort the write.
 *
 * @param {string} targetPath - The absolute or relative path of the file that
 *   is about to be written. (Provided for future extensibility; currently
 *   unused in the check.)
 */
function validateWrite(targetPath) {
  // Resolve the expected location of the implementation plan relative to the
  // repository root. The bridge runs from `C:\tools\workspace\TheSource`.
  const repoRoot = path.resolve(__dirname, '..'); // diagnostics/ is one level deep
  const planPath = path.join(repoRoot, 'Implementation_Plan.md');

  if (!fs.existsSync(planPath)) {
    // Throw a descriptive error that can be caught by the bridge's write
    // interceptor. The error message follows the bridge's logging format.
    throw new Error(
      `Blueprint validation failed: Implementation_Plan.md not found at ${planPath}. ` +
        'All file writes require an approved implementation plan.'
    );
  }
  // If the file exists, the write is allowed – simply return.
  return true;
}

module.exports = { validateWrite };
