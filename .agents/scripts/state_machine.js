/**
 * 🟣 StateMachine — Sovereign State Management for Aether Engine V11.0
 * Part of: Phase 2 — 85 → 92 (Zero-Token Orchestration)
 *
 * Usage: node state_machine.js [--cmd=status|transition|snapshot] [--state=...]
 * Bridge: TELEPATHY: state → bridge.json.state
 *
 * Manages: Tool states, Phase progress, Cognitive state, Session lifecycle
 */

const fs = require("fs");
const path = require("path");

const BRIDGE_PATH = path.join(
  __dirname,
  "..",
  "memory",
  "telepathy",
  "bridge.json",
);
const STATE_PATH = path.join(
  __dirname,
  "..",
  "memory",
  "telepathy",
  "state.json",
);

// ─── State Definitions ───────────────────────────────────────

const PHASES = {
  init: { order: 0, label: "التهيئة", next: "phase1" },
  phase1: {
    order: 1,
    label: "المرحلة 1: الأدوات الأساسية",
    next: "phase2",
    target_score: 85,
  },
  phase2: {
    order: 2,
    label: "المرحلة 2: الخدمات",
    next: "phase3",
    target_score: 92,
  },
  phase3: {
    order: 3,
    label: "المرحلة 3: التكامل المتقدم",
    next: "phase4",
    target_score: 97,
  },
  phase4: {
    order: 4,
    label: "المرحلة 4: الصقل النهائي",
    next: "complete",
    target_score: 100,
  },
  complete: {
    order: 5,
    label: "مكتمل — SUPRA-ZENITH",
    next: null,
    target_score: 100,
  },
};

const TOOL_STATES = [
  "planned",
  "building",
  "testing",
  "production_ready",
  "deprecated",
];
const COGNITIVE_STATES = [
  "idle",
  "planning",
  "executing",
  "reviewing",
  "self_healing",
  "telepathy",
];

// ─── State Machine Class ─────────────────────────────────────

class StateMachine {
  constructor() {
    this.state = this.load() || this.defaultState();
  }

  defaultState() {
    return {
      version: "V11.0-Supra-Zenith",
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      phase: {
        current: "phase1",
        history: [],
        score: 85,
        target: 100,
      },
      tools: {},
      cognitive: {
        current: "executing",
        history: [],
        session_id: `session-${Date.now()}`,
      },
      metrics: {
        total_operations: 0,
        successful_operations: 0,
        failed_operations: 0,
        tools_built: 0,
        uptime_start: new Date().toISOString(),
      },
      bridge: {
        last_sync: null,
        pulses_sent: 0,
        pulses_received: 0,
      },
    };
  }

  load() {
    try {
      if (fs.existsSync(STATE_PATH)) {
        return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
      }
    } catch (e) {
      /* ignore */
    }
    return null;
  }

  save() {
    this.state.updated = new Date().toISOString();
    fs.writeFileSync(STATE_PATH, JSON.stringify(this.state, null, 2));
    this.syncBridge();
  }

  syncBridge() {
    try {
      if (fs.existsSync(BRIDGE_PATH)) {
        const bridge = JSON.parse(fs.readFileSync(BRIDGE_PATH, "utf-8"));
        bridge.shared_context.score = this.state.phase.score;
        bridge.shared_context.phase =
          PHASES[this.state.phase.current]?.order || 0;
        bridge.shared_context.maturity_level = this.state.version;
        bridge.state_snapshot = {
          phase: this.state.phase.current,
          score: this.state.phase.score,
          cognitive: this.state.cognitive.current,
          tools_ready: this.getProductionReadyCount(),
        };
        fs.writeFileSync(BRIDGE_PATH, JSON.stringify(bridge, null, 2));
        this.state.bridge.last_sync = new Date().toISOString();
      }
    } catch (e) {
      /* non-critical */
    }
  }

  // ─── Phase Management ──────────────────────────────────

  getCurrentPhase() {
    return {
      ...PHASES[this.state.phase.current],
      score: this.state.phase.score,
    };
  }

  transitionPhase(targetPhase) {
    if (!PHASES[targetPhase]) {
      return { success: false, error: `Unknown phase: ${targetPhase}` };
    }

    const current = PHASES[this.state.phase.current];
    const target = PHASES[targetPhase];

    if (
      target.order <= current.order &&
      targetPhase !== this.state.phase.current
    ) {
      return {
        success: false,
        error: `Cannot go backwards: ${current.label} → ${target.label}`,
      };
    }

    const previous = this.state.phase.current;
    this.state.phase.history.push({
      from: previous,
      to: targetPhase,
      timestamp: new Date().toISOString(),
      score_at_transition: this.state.phase.score,
    });

    this.state.phase.current = targetPhase;
    this.state.phase.score = target.target_score || this.state.phase.score;
    this.save();

    return {
      success: true,
      from: previous,
      to: targetPhase,
      label: target.label,
      score: this.state.phase.score,
    };
  }

  // ─── Tool State Management ─────────────────────────────

  registerTool(name, category, maturity = 0) {
    this.state.tools[name] = {
      name,
      category,
      state: "planned",
      maturity,
      registered: new Date().toISOString(),
      history: [{ state: "planned", timestamp: new Date().toISOString() }],
    };
    this.state.metrics.tools_built = Object.keys(this.state.tools).length;
    this.save();
    return this.state.tools[name];
  }

  updateToolState(name, newState, maturity = null) {
    if (!this.state.tools[name]) {
      return { success: false, error: `Tool not registered: ${name}` };
    }
    if (!TOOL_STATES.includes(newState)) {
      return { success: false, error: `Invalid state: ${newState}` };
    }

    const tool = this.state.tools[name];
    tool.state = newState;
    if (maturity !== null) tool.maturity = maturity;
    tool.history.push({ state: newState, timestamp: new Date().toISOString() });
    this.save();
    return { success: true, tool };
  }

  getProductionReadyCount() {
    return Object.values(this.state.tools).filter(
      (t) => t.state === "production_ready",
    ).length;
  }

  // ─── Cognitive State ───────────────────────────────────

  setCognitive(state) {
    if (!COGNITIVE_STATES.includes(state)) {
      return { success: false, error: `Invalid cognitive state: ${state}` };
    }
    this.state.cognitive.history.push({
      from: this.state.cognitive.current,
      to: state,
      timestamp: new Date().toISOString(),
    });
    this.state.cognitive.current = state;
    this.save();
    return { success: true, cognitive: state };
  }

  // ─── Metrics ───────────────────────────────────────────

  recordOperation(success = true) {
    this.state.metrics.total_operations++;
    if (success) {
      this.state.metrics.successful_operations++;
    } else {
      this.state.metrics.failed_operations++;
    }
    this.save();
  }

  recordPulse(direction = "sent") {
    if (direction === "sent") {
      this.state.bridge.pulses_sent++;
    } else {
      this.state.bridge.pulses_received++;
    }
    this.save();
  }

  // ─── Snapshot ──────────────────────────────────────────

  snapshot() {
    return {
      version: this.state.version,
      phase: this.getCurrentPhase(),
      cognitive: this.state.cognitive.current,
      session: this.state.cognitive.session_id,
      tools: {
        total: Object.keys(this.state.tools).length,
        production_ready: this.getProductionReadyCount(),
        breakdown: Object.entries(this.state.tools).reduce((acc, [name, t]) => {
          acc[name] = { state: t.state, maturity: t.maturity };
          return acc;
        }, {}),
      },
      metrics: {
        operations: this.state.metrics.total_operations,
        success_rate:
          this.state.metrics.total_operations > 0
            ? Math.round(
                (this.state.metrics.successful_operations /
                  this.state.metrics.total_operations) *
                  100,
              )
            : 100,
        tools_built: this.state.metrics.tools_built,
        pulses:
          this.state.bridge.pulses_sent + this.state.bridge.pulses_received,
      },
      score: this.state.phase.score,
      target: this.state.phase.target,
      progress_pct: Math.round(
        (this.state.phase.score / this.state.phase.target) * 100,
      ),
    };
  }
}

// ─── CLI ────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd =
    args.find((a) => a.startsWith("--cmd="))?.split("=")[1] || "status";

  const sm = new StateMachine();

  switch (cmd) {
    case "status":
      console.log(JSON.stringify(sm.snapshot(), null, 2));
      break;

    case "transition": {
      const target = args.find((a) => a.startsWith("--state="))?.split("=")[1];
      if (!target) {
        console.log(JSON.stringify({ error: "--state=phase2 required" }));
        process.exit(1);
      }
      const result = sm.transitionPhase(target);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "register-tool": {
      const name = args.find((a) => a.startsWith("--name="))?.split("=")[1];
      const category =
        args.find((a) => a.startsWith("--category="))?.split("=")[1] ||
        "uncategorized";
      if (!name) {
        console.log(JSON.stringify({ error: "--name=ToolName required" }));
        process.exit(1);
      }
      const result = sm.registerTool(name, category);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "update-tool": {
      const name = args.find((a) => a.startsWith("--name="))?.split("=")[1];
      const state = args.find((a) => a.startsWith("--state="))?.split("=")[1];
      const maturity = args
        .find((a) => a.startsWith("--maturity="))
        ?.split("=")[1];
      if (!name || !state) {
        console.log(
          JSON.stringify({
            error: "--name=ToolName --state=production_ready required",
          }),
        );
        process.exit(1);
      }
      const result = sm.updateToolState(
        name,
        state,
        maturity ? parseInt(maturity) : null,
      );
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "cognitive": {
      const state = args.find((a) => a.startsWith("--state="))?.split("=")[1];
      if (!state) {
        console.log(JSON.stringify({ error: "--state=planning required" }));
        process.exit(1);
      }
      const result = sm.setCognitive(state);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case "snapshot":
      console.log(JSON.stringify(sm.snapshot(), null, 2));
      break;

    case "init": {
      // Register all existing tools
      const tools = [
        ["FileRead", "👁️ The Vision", 100],
        ["FileReadLines", "👁️ The Vision", 100],
        ["FileWrite", "✋ The Weaver", 100],
        ["SurgicalDiff", "✋ The Weaver", 100],
        ["Bash", "🦿 The Echo", 95],
        ["Grep", "👁️ The Vision", 100],
        ["Glob", "👁️ The Vision", 95],
        ["TodoWrite", "🧪 The Fusion", 90],
        ["SemanticReference", "🧪 The Fusion", 100],
        ["VisualAuditReport", "📊 The Sovereign", 100],
        ["Sleep", "🦿 The Echo", 100],
        ["EnterPlanMode", "🧠 The Head", 100],
        ["ExitPlanMode", "🧠 The Head", 100],
        ["WebFetch", "👁️ The Vision", 95],
        ["WebSearch", "👁️ The Vision", 95],
        ["TokenEstimation", "📊 The Sovereign", 85],
        ["ToolSearch", "📊 The Sovereign", 100],
      ];

      tools.forEach(([name, cat, mat]) => {
        sm.registerTool(name, cat, mat);
        sm.updateToolState(name, "production_ready", mat);
      });

      sm.transitionPhase("phase2");
      sm.setCognitive("executing");
      console.log(JSON.stringify(sm.snapshot(), null, 2));
      break;
    }

    default:
      console.log(
        JSON.stringify({
          error: `Unknown command: ${cmd}`,
          usage:
            "node state_machine.js --cmd=status|transition|register-tool|update-tool|cognitive|snapshot|init",
        }),
      );
  }
}

module.exports = { StateMachine, PHASES, TOOL_STATES, COGNITIVE_STATES };
