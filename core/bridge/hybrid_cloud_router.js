const { RelayBridge } = require('../../relay_bridge.js');

class HybridCloudRouter extends RelayBridge {
  constructor(apiKey) {
    super(apiKey);
  }

  // Determine if a prompt is planning/strategic or coding/atomic
  isStrategicTask(prompt) {
    const strategicKeywords = [
      'خطط', 'خطه', 'تحليل', 'تصميم', 'معمارية', 'تقييم', 'تقرير', 'مخطط',
      'plan', 'design', 'analyze', 'architecture', 'review', 'audit', 'evaluate', 'strategy'
    ];
    const promptLower = (prompt || '').toLowerCase();
    return strategicKeywords.some(kw => promptLower.includes(kw));
  }

  // Get the recommended model based on task type
  getTargetModel(prompt) {
    if (this.isStrategicTask(prompt)) {
      // Use Gemini-Flash for planning/strategy (1M context, smart planner)
      return process.env.AETHER_PLANNER_MODEL || 'google/gemini-2.5-flash:free';
    } else {
      // Use Qwen/DeepSeek for coding (surgical execution)
      return process.env.AETHER_EXECUTOR_MODEL || 'deepseek-ai/DeepSeek-V3';
    }
  }

  async runRoutedAgent(prompt, history = [], systemPrompt = '', tools = []) {
    const targetModel = this.getTargetModel(prompt);
    console.error(`[HybridCloudRouter] Routing query to target model: "${targetModel}"`);

    const formattedMessages = history.map(h => ([
      { role: 'user', content: h.user },
      { role: 'assistant', content: h.bot }
    ])).flat();
    
    formattedMessages.push({ role: 'user', content: prompt });

    const payload = {
      model: targetModel,
      system: systemPrompt,
      messages: formattedMessages,
      max_tokens: 4096,
      tools: tools
    };

    try {
      return await this.createMessage(payload);
    } catch (e) {
      console.warn(`[HybridCloudRouter] Failed with target model "${targetModel}": ${e.message}. Attempting emergency backup...`);
      // Emergency failover to fallback model
      const backupModel = targetModel.includes('gemini') 
        ? (process.env.AETHER_EXECUTOR_MODEL || 'deepseek-ai/DeepSeek-V3')
        : (process.env.AETHER_PLANNER_MODEL || 'google/gemini-2.5-flash:free');
      
      payload.model = backupModel;
      console.error(`[HybridCloudRouter] Emergency fallback routing to: "${backupModel}"`);
      return await this.createMessage(payload);
    }
  }
}

module.exports = {
  HybridCloudRouter,
  routerInstance: new HybridCloudRouter()
};
