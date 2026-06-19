class AutoModeClassifier {
    /**
     * Determines the most efficient routing, effort level, and budget for an AI task
     * BEFORE invoking the heavy LLM models.
     * @param {string} prompt The raw user intent or swarm instruction
     */
    classifyTask(prompt) {
        let effortLevel = 'LOW';
        let assignedModel = 'Gemini-Flash-3.5';
        let budgetTokens = 500;

        const complexKeywords = ['architecture', 'ast', 'refactor', 'singularity', 'audit'];
        
        if (complexKeywords.some(kw => prompt.toLowerCase().includes(kw))) {
            effortLevel = 'MAX';
            assignedModel = 'Gemini-Pro-3.1';
            budgetTokens = 50000;
        }

        return {
            status: 'CLASSIFIED',
            effort_level: effortLevel,
            model_route: assignedModel,
            budget_limit: budgetTokens,
            message: `Task routed to ${assignedModel} at ${effortLevel} effort.`
        };
    }
}

module.exports = { AutoModeClassifier };
