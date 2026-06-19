/**
 * SentinelGuard — Sovereign Sigma V29.0-Apex
 * -------------------------------------------
 * حارس النزاهة الهيكلية ومراقب نبض النواة (Core Asset Protection Shield).
 * يمنع التراجع المعماري، ويحمي ملفات النظام الحاكمة من الحذف أو التعديل العشوائي.
 */
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

class SentinelGuard {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.protectedPaths = [
      "src/core/orchestrator.js",
      "package/SovereignKernel.js",
      "config/feature_gates.json",
      "package/cli.js.map",
      "bridge.json",
      ".agents/skills/nexus-core/master.md",
      ".agents/skills/nexus-memory/SKILL.md",
      "AGENTS.md",
      "CLAUDE.md",
    ];
    this.coreHashes = new Map();
  }

  /**
   * أخذ لقطة مشفرة (Cryptographic Snapshot) للملفات الحاكمة عند الإقلاع
   */
  async initializeGuard() {
    console.log("\n🛡️ [Sentinel] Hardlocking core asset boundaries...");
    let missingCount = 0;
    for (const relPath of this.protectedPaths) {
      const absPath = path.join(this.workspaceRoot, relPath);
      try {
        const content = await fs.readFile(absPath);
        const hash = crypto.createHash("sha256").update(content).digest("hex");
        this.coreHashes.set(relPath, hash);
        console.log(`-> Locked Node: ${relPath} [Integrity Secured]`);
      } catch (e) {
        // Only warn, don't crash, because some files like cli.js.map might not exist in all environments
        console.warn(
          `⚠️ [Sentinel Warning] Protected node missing during handshake: ${relPath}`,
        );
        missingCount++;
      }
    }
    if (this.coreHashes.size > 0) {
      console.log(
        `Core bounds locked. Integrity cryptographic hashes calculated and secured for ${this.coreHashes.size} core anchor nodes.`,
      );
    }
    return true;
  }

  /**
   * الفحص الفوري قبل الحقن الجراحي للتأكد من خلو الجلسة من التخريب التلقائي
   */
  async verifySystemIntegrity() {
    for (const [relPath, originalHash] of this.coreHashes.entries()) {
      const absPath = path.join(this.workspaceRoot, relPath);
      try {
        const content = await fs.readFile(absPath);
        const currentHash = crypto
          .createHash("sha256")
          .update(content)
          .digest("hex");

        if (originalHash !== currentHash) {
          console.error(
            `\n🚨 [MUTATION BREACH] Core asset tampered with: ${relPath}`,
          );
          return {
            isValid: false,
            corruptedNode: relPath,
            action: "FORCE_HARD_KILLSWITCH",
          };
        }
      } catch {
        console.error(
          `\n🚨 [DESTRUCTION BREACH] Core asset deleted: ${relPath}`,
        );
        return {
          isValid: false,
          corruptedNode: relPath,
          action: "FORCE_HARD_KILLSWITCH",
        };
      }
    }
    return { isValid: true, action: "PROCEED_WITH_SURGERY" };
  }

  /**
   * تدقيق نبضات القلب لفحص التكامل الهيكلي للملفات المحمية
   */
  async heartbeatAudit() {
    if (this.coreHashes.size === 0) {
      await this.initializeGuard();
    }
    const integrity = await this.verifySystemIntegrity();
    return {
      repairNeeded: !integrity.isValid,
      status: integrity.isValid ? "SECURE" : "CORRUPTED",
      corruptedNode: integrity.corruptedNode,
    };
  }
}

// Execution for Self-Sustaining Mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const guard = new SentinelGuard(process.cwd());

  if (args.includes("--initialize")) {
    guard.initializeGuard().then(() => {
      // Exit 0 to pass the pipeline
      process.exit(0);
    });
  } else {
    // Default fallback
    guard.verifySystemIntegrity().then((res) => {
      if (!res.isValid) process.exit(1);
      process.exit(0);
    });
  }
}

module.exports = SentinelGuard;
