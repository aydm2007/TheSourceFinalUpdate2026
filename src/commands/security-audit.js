const fs = require("fs");
const path = require("path");

console.log("🚀 Starting Sovereign Security Audit...");

const secretRegex = /(sk-[A-Za-z0-9]{20,}|SECRET_KEY|password\s*=)/g;
const violations = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!["node_modules", ".git", "dist", "package"].includes(file)) {
        scanDir(fullPath);
      }
    } else if (
      (file.endsWith(".ts") ||
        file.endsWith(".js") ||
        file.endsWith(".json")) &&
      !file.includes("security-audit.js") &&
      !file.includes("preToolUse.ts") &&
      !file.includes("marketplaceManager.ts")
    ) {
      const content = fs.readFileSync(fullPath, "utf8");
      const matches = content.match(secretRegex);
      if (matches) {
        violations.push({ file: fullPath, secrets: matches });
      }
    }
  }
}

scanDir(process.cwd());

if (violations.length > 0) {
  console.error("🚨 Security Violations Found:");
  violations.forEach((v) => {
    console.error(`- ${v.file}: ${v.secrets.join(", ")}`);
  });
  process.exit(1);
} else {
  console.log("✅ No obvious secrets found in codebase.");
  process.exit(0);
}
