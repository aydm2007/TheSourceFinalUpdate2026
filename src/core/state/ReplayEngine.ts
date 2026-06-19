export class ReplayEngine {
  replay(events: any[]): Record<string, any> {
    const state: Record<string, any> = {};
    for (const event of events) {
      const type = event.type || (event.tool ? `tool.${event.tool}` : '');
      const payload = event.payload || event.args || {};
      
      switch (type) {
        case "memory.add":
        case "tool.memory.add":
          if (payload.key !== undefined) {
            state[payload.key] = payload.value;
          }
          break;
        case "memory.delete":
        case "tool.memory.delete":
          if (payload.key !== undefined) {
            delete state[payload.key];
          }
          break;
        case "tool.run_command":
          state["last_command"] = payload.cmd || payload.CommandLine || '';
          break;
      }
    }
    return state;
  }
}

export default new ReplayEngine();
