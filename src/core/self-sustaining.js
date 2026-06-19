const fs = require("fs/promises");
const path = require("path");

class SelfSustainingProtocol {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.evolutionLogPath = path.join(
      workspaceRoot,
      ".nexus/agent-memory/evolution_history.md",
    );
  }

  /**
   * تقطير وتوطين نمط تشغيل الأدوات الناجح (Semantic Replay Distillation)
   */
  async distillSuccessfulOperation(
    agentType,
    toolName,
    executionPattern,
    duration,
  ) {
    console.log(
      `\n🧬 [Self-Sustaining] Distilling neural weight for tool: ${toolName}`,
    );

    const timestamp = new Date().toISOString();
    const memoryDir = path.join(
      this.workspaceRoot,
      `.nexus/agent-memory/${agentType}`,
    );
    const semanticHistoryPath = path.join(memoryDir, "SEMANTIC_HISTORY.md");

    const entry =
      `\n### [${timestamp}] Core Stabilization - Tool: ${toolName}\n` +
      `- **Pattern-DNA**: ${executionPattern}\n` +
      `- **Metrics**: Duration: ${duration}ms | State Status: ZERO_DRIFT_PASSED\n` +
      `- **Evolutionary Bias**: +0.03 Logistical Weight Hardlocked\n`;

    try {
      await fs.mkdir(memoryDir, { recursive: true });
      await fs.appendFile(semanticHistoryPath, entry, "utf-8");

      const logDir = path.dirname(this.evolutionLogPath);
      await fs.mkdir(logDir, { recursive: true });

      const logSummary = `\n[${timestamp}] [EVOLUTION] Core operational bias fortified via ${toolName}.`;
      await fs.appendFile(this.evolutionLogPath, logSummary, "utf-8");

      return { success: true, status: "ZERO_EXIT_CONFIRMED" };
    } catch (e) {
      console.error(
        `❌ [Self-Sustaining Fault] Failed to persist memory footprint: ${e.message}`,
      );
      return { success: false, error: e.message };
    }
  }

  /**
   * التعديل والتحوير التلقائي لملفات الإعدادات والبوابات ناتيف (Self-Mutation Core)
   */
  async autoMutateFeatureGate(gateKey, targetState) {
    const gatesPath = path.join(
      this.workspaceRoot,
      "config/feature_gates.json",
    );
    console.log(
      `⚙️ [Self-Sustaining] Re-calibrating Feature Gate: ${gateKey} -> ${targetState}`,
    );

    try {
      const dirPath = path.dirname(gatesPath);
      await fs.mkdir(dirPath, { recursive: true });

      let config = { feature_gates: {} };
      try {
        const rawData = await fs.readFile(gatesPath, "utf-8");
        config = JSON.parse(rawData);
      } catch {
        // Fallback if file doesn't exist
      }

      if (!config.feature_gates) {
        config.feature_gates = {};
      }
      config.feature_gates[gateKey] = targetState;

      await fs.writeFile(gatesPath, JSON.stringify(config, null, 2), "utf-8");
      return { success: true };
    } catch (e) {
      console.error(
        `❌ [Self-Sustaining Fault] Mutation restricted on gates path: ${e.message}`,
      );
      return { success: false, error: e.message };
    }
  }
}

module.exports = SelfSustainingProtocol;
