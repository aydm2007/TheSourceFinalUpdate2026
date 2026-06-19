const EventEmitter = require('events');

class SwarmTelepathyBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Broadcasts a semantic payload to all listening Sovereign Agents.
   * Enables asynchronous multi-agent coordination (e.g. SecurityGuard + FinanceAuditor simultaneously).
   */
  async broadcast(channel, sender, payload) {
    console.error(`[TelepathyBus] Broadcasting on channel '${channel}' from Agent: [${sender}]`);
    
    return new Promise((resolve) => {
      let responses = [];
      let expectedResponses = this.listenerCount(channel);
      
      if (expectedResponses === 0) {
        return resolve({ success: true, responses: [] });
      }

      const timeout = setTimeout(() => {
        resolve({ success: true, status: 'TIMEOUT', responses });
      }, 5000); // 5-second max wait for parallel agents

      this.emit(channel, payload, (agentName, agentResponse) => {
        responses.push({ agent: agentName, data: agentResponse });
        if (responses.length === expectedResponses) {
          clearTimeout(timeout);
          resolve({ success: true, status: 'CONSENSUS_REACHED', responses });
        }
      });
    });
  }
}

// Singleton instance for global MCP usage
const globalTelepathyBus = new SwarmTelepathyBus();
module.exports = { SwarmTelepathyBus, globalTelepathyBus };
