/**
 * Sovereign Memory Sync — AETHER-ZENITH V15.0-Apex
 * Optimized for Enterprise GRP Standards.
 */

const fs = require("fs");
const path = require("path");
// Note: We'll use a direct implementation here if the class-based one needs transpilation,
// but assuming the environment supports it or we use the existing adapter.
const {
  VectorMemoryAdapter,
} = require("../../../TheSource/src/services/teamMemorySync/vectorAdapter.js");

async function syncSovereignMemory() {
  const timestamp = new Date().toISOString();
  console.log(
    `\n[${timestamp}] 🚀 Starting Sovereign Memory Synchronization (Apex Edition)...`,
  );

  // Auto-detect project root
  const projectRoot = path.resolve(__dirname, "../../");
  const memoryDir = path.join(projectRoot, ".agents", "memory");
  const ledgerPath = path.join(memoryDir, "audit_ledger.md");

  try {
    console.log(`🔍 Target Path: ${projectRoot}`);

    // 1. Initialize Adapter
    const adapter = new VectorMemoryAdapter(projectRoot);

    // 2. Perform Vectorization
    await adapter.vectorize();

    // 3. Update Audit Ledger
    if (fs.existsSync(ledgerPath)) {
      const auditEntry = `| ${timestamp.split("T")[0]} | مزامنة الذاكرة | Vector Memory | ✅ تم النجاح | مزامنة تلقائية عبر Apex Sync Script. |\n`;
      let ledgerContent = fs.readFileSync(ledgerPath, "utf-8");

      // Inject entry before the last update line or at the end of the table
      if (ledgerContent.includes("---")) {
        const parts = ledgerContent.split("---");
        parts[1] = parts[1].trim() + "\n" + auditEntry + "\n";
        ledgerContent = parts.join("---\n");
      } else {
        ledgerContent += `\n${auditEntry}`;
      }

      fs.writeFileSync(ledgerPath, ledgerContent, "utf-8");
      console.log("📝 Audit Ledger updated successfully.");
    }

    console.log(
      "\n✅ [SUCCESS] Sovereign Memory is now fully synchronized and auditable.",
    );
  } catch (error) {
    console.error(`\n❌ [FAILURE] Sync failed: ${error.message}`);
    process.exit(1);
  }
}

syncSovereignMemory();
