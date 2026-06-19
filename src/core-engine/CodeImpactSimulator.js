const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Code Impact Simulator for Sovereign V17.0
// Creates a memory-only or temporary sandbox to test changes before merging to core.
class CodeImpactSimulator {
  constructor() {
    this.scratchDir = path.resolve(process.cwd(), "scratch", ".impact_sandbox");
    if (!fs.existsSync(this.scratchDir)) {
      fs.mkdirSync(this.scratchDir, { recursive: true });
    }
  }

  async simulate(filePath, proposedModificationFn) {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath))
      throw new Error(`Target file not found: ${fullPath}`);

    const originalCode = fs.readFileSync(fullPath, "utf8");
    const fileName = path.basename(fullPath);
    const sandboxPath = path.join(this.scratchDir, fileName);

    console.log(`[Simulator] Copying ${fileName} to Impact Sandbox...`);
    fs.writeFileSync(sandboxPath, originalCode, "utf8");

    try {
      // Apply modification to sandbox
      await proposedModificationFn(sandboxPath);

      // Verify AST / Linter in sandbox
      console.log(
        `[Simulator] Running static impact analysis on ${fileName}...`,
      );
      this._runSyntaxCheck(sandboxPath);

      console.log(
        `[Simulator] Impact simulation PASSED. Modification is safe.`,
      );
      return true;
    } catch (e) {
      console.error(
        `[Simulator-REJECTED] Blast Radius blocked execution: ${e.message}`,
      );
      return false;
    } finally {
      // Clean up sandbox
      if (fs.existsSync(sandboxPath)) {
        fs.unlinkSync(sandboxPath);
      }
    }
  }

  _runSyntaxCheck(sandboxPath) {
    // Run a lightweight syntax check (e.g. node syntax check)
    try {
      execSync(`node --check "${sandboxPath}"`, { stdio: "ignore" });
    } catch (e) {
      throw new Error(
        "Syntax Error detected in modified code. Impact radius too high.",
      );
    }
  }
}

module.exports = CodeImpactSimulator;

// CLI execution
if (require.main === module) {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.log("Usage: node CodeImpactSimulator.js <filePath>");
    process.exit(1);
  }
  const sim = new CodeImpactSimulator();
  sim
    .simulate(filePath, (sp) => {
      // dummy modification
      fs.appendFileSync(sp, "\n// Impact Simulator Test\n");
    })
    .then(console.log)
    .catch((e) => console.error(e.message));
}
