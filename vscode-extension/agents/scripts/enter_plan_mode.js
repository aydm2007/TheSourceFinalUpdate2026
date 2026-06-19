// EnterPlanModeTool - Plan Mode Toggle (Enter)
// Part of: Aether Engine V11.0 - Zero-Token Orchestration
// Usage: node enter_plan_mode.js "<plan_description>"
// Bridge: TELEPATHY: enter plan mode "description"

var fs = require('fs');
var path = require('path');

var STATE_FILE = path.join(__dirname, '..', 'memory', 'telepathy', 'plan_mode_state.json');

var description = process.argv[2] || 'Untitled Plan';

var state = { plan_mode: true, plan_history: [] };
try {
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
} catch (e) {}

state.plan_mode = true;
state.current_plan = {
  description: description,
  started_at: new Date().toISOString(),
  steps: []
};

fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

console.log(JSON.stringify({
  status: 'plan_mode_entered',
  plan_mode: true,
  plan: description,
  timestamp: new Date().toISOString()
}, null, 2));
