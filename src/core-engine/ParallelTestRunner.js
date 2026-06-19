/**
 * ParallelTestRunner — Sovereign Sigma V16.0
 * --------------------------------------------
 * يفتح قنوات فيزيائية مع المترجمات المحلية لتشغيل الفحوصات بالتوازي والتحقق من كود الخروج الصفر.
 */
const { exec } = require("child_process");

class ParallelTestRunner {
  constructor() {
    this.suites = [
      { name: "lint", cmd: "npm run lint" },
      { name: "unit", cmd: "npm run test" },
    ];
  }

  async runTests(targetFile) {
    console.log(
      `\n🧪 [TestRunner] Running multi-layer test suite concurrently for: ${targetFile || "workspace"}`,
    );

    const promises = this.suites.map((suite) => {
      return new Promise((resolve) => {
        const startTime = Date.now();
        exec(suite.cmd, (error, stdout, stderr) => {
          const duration = Date.now() - startTime;
          resolve({
            name: suite.name,
            passed: !error,
            exitCode: error ? error.code || 1 : 0,
            stdout,
            stderr,
            duration,
          });
        });
      });
    });

    const results = await Promise.all(promises);

    const allPassed = results.every((r) => r.passed);
    const combinedStdout = results
      .map((r) => `[${r.name}] ${r.stdout}`)
      .join("\n");
    const combinedStderr = results
      .map((r) => (r.stderr ? `[${r.name}] ${r.stderr}` : ""))
      .filter(Boolean)
      .join("\n");

    return {
      passed: allPassed,
      exitCode: allPassed ? 0 : 1,
      stdout: combinedStdout,
      stderr: combinedStderr,
      details: results,
    };
  }
}
module.exports = ParallelTestRunner;
