const fs = require("fs");
const path = require("path");

class TerminalPet {
  constructor(workspaceRoot = process.cwd()) {
    this.frames = {
      IDLE: "(◕‿◕) [TheSource: Idle]",
      HEALING: "⚙️(☼_☼)⚙️ [AST Surgery Active]",
      ERROR: "🚨(✖_✖)🚨 [Violation Detected!]",
    };
    this.healthFile = path.resolve(workspaceRoot, "SYSTEM_HEALTH_LIVE.md");
  }

  renderPetState() {
    let currentState = this.frames.IDLE;

    if (fs.existsSync(this.healthFile)) {
      try {
        const healthContent = fs.readFileSync(this.healthFile, "utf8");
        if (healthContent.includes("REPAIRING")) {
          currentState = this.frames.HEALING;
        } else if (
          healthContent.includes("CRITICAL") ||
          healthContent.includes("Drifts: 1")
        ) {
          currentState = this.frames.ERROR;
        }
      } catch (e) {
        // صامت لمنع تشويه مخرجات الطرفية
      }
    }

    // إخراج نظيف للفريم الملون في نفس السطر
    process.stdout.write(`\r\x1b[36m[Pet]: ${currentState}\x1b[0m `);
  }
}

module.exports = { TerminalPet };
