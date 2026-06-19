// ExitPlanModeTool - Plan Mode Toggle
// Part of: Aether Engine V11.0 - Zero-Token Orchestration
// Usage: node exit_plan_mode.js [--save]
// Bridge: TELEPATHY: exit plan mode [--save]

var fs = require("fs");
var path = require("path");

var STATE_FILE = path.join(
  __dirname,
  "..",
  "memory",
  "telepathy",
  "plan_mode_state.json",
);

// Read current state
var state = { plan_mode: true, plan_history: [] };
try {
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  }
} catch (e) {
  // Use defaults
}

var savePlan = process.argv.includes("--save");

if (savePlan && state.current_plan) {
  state.plan_history.push({
    exited_at: new Date().toISOString(),
    plan: state.current_plan,
  });
}

// Toggle
state.plan_mode = false;
state.current_plan = null;
state.last_exit = new Date().toISOString();

fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

console.log(
  JSON.stringify(
    {
      status: "plan_mode_exited",
      plan_mode: false,
      saved: savePlan,
      total_plans_completed: state.plan_history.length,
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  ),
);
