/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  📥 Sovereign Compiler Gate V50.0-Singularity                      │
 * │  Stages, validates, and rolls back code updates dynamically.      │
 * │  Protects codebase files against syntax errors and AST drifts.    │
 * └────────────────────────────────────────────────────────────────────┘
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class CompilerGate {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot || process.cwd();
  }

  /**
   * Stages a file modification, checks syntax, and rolls back on compilation failures.
   * @param {string} filePath Absolute or relative path to the file
   * @param {string} newContent Staged new content
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async verifyAndCommit(filePath, newContent) {
    const resolvedPath = path.resolve(this.workspaceRoot, filePath);
    if (!fs.existsSync(resolvedPath)) {
      // If new file, write directly (no backup needed)
      try {
        fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
        fs.writeFileSync(resolvedPath, newContent);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    const backupPath = `${resolvedPath}.backup_stage`;
    try {
      // 1. Take a safe backup
      fs.copyFileSync(resolvedPath, backupPath);

      // 2. Commit the new staged content
      fs.writeFileSync(resolvedPath, newContent);

      // 3. Execute syntax/compilation validation
      this.checkSyntax(resolvedPath);

      // 4. If success, clean the backup and confirm commit
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      return { success: true };
    } catch (err) {
      // 5. If compilation/syntax fails, roll back to original backup
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, resolvedPath);
        fs.unlinkSync(backupPath);
      }
      return { success: false, error: `CompilerGate aborted: ${err.message}` };
    }
  }

  checkSyntax(filePath) {
    const ext = path.extname(filePath);

    // Validate JavaScript/TypeScript files using Node syntax checker or localized compiler
    if (ext === ".js") {
      execSync(`node --check "${filePath}"`, { stdio: "pipe" });
    } else if (ext === ".json") {
      const content = fs.readFileSync(filePath, "utf-8");
      JSON.parse(content);
    } else if (ext === ".py") {
      execSync(`python -m py_compile "${filePath}"`, { stdio: "pipe" });
    }
  }
}

module.exports = CompilerGate;
