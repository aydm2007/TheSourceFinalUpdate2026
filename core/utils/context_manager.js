/**
 * context_manager.js — Aether Sovereign Context Compaction Engine
 * Inspired by Claude Code's advanced context management.
 * 
 * Functions:
 * 1. Token Estimation: Approximate token counting for safety.
 * 2. Compaction: Summarizing older parts of the conversation to save space.
 * 3. Truncation: Fail-safe removal of non-essential early history.
 */

class ContextManager {
  constructor(limit = 60000) {
    this.tokenLimit = limit;
  }

  /**
   * Approximate token count (Character-based heuristic for zero-dependency)
   */
  estimateTokens(messages) {
    const text = JSON.stringify(messages);
    return Math.ceil(text.length / 4); // Standard heuristic for LLMs
  }

  /**
   * Compacts history by summarizing the first 50% of messages 
   * if the token count exceeds the threshold.
   */
  async compact(messages, orchestrator) {
    const currentTokens = this.estimateTokens(messages);
    if (currentTokens < this.tokenLimit * 0.8) return messages;

    console.error(`\x1b[33m[ContextManager] High token density detected (${currentTokens}). Compacting...\x1b[0m`);

    // Keep the first system message if it exists
    const systemMessage = messages.find(m => m.role === 'system');
    const conversation = messages.filter(m => m.role !== 'system');

    // Split: Compact the first half, keep the second half as-is
    const splitPoint = Math.floor(conversation.length / 2);
    const toCompact = conversation.slice(0, splitPoint);
    const toKeep = conversation.slice(splitPoint);

    if (toCompact.length === 0) return messages;

    // Use the AI itself to summarize the past history (The "Reflective" Pattern)
    const summaryPrompt = `Please summarize the following conversation history concisely, preserving all key decisions, file paths mentioned, and technical goals. Output ONLY the summary.\n\n${JSON.stringify(toCompact)}`;
    
    try {
        const pulse = await orchestrator.createPulse({
            messages: [{ role: 'user', content: summaryPrompt }],
            temperature: 0.3,
            max_tokens: 500
        });

        const summaryText = pulse.content[0].text;
        
        let finalizedHistory = newHistory;
        
        // Post-Compaction Absolute Fail-Safe Truncation
        let finalTokens = this.estimateTokens(finalizedHistory);
        if (finalTokens > this.tokenLimit) {
            console.warn(`[ContextManager] ⚠️ Post-compaction tokens (${finalTokens}) still exceed limit (${this.tokenLimit}). Enforcing absolute truncation safety...`);
            while (finalizedHistory.length > 3 && finalTokens > this.tokenLimit) {
                finalizedHistory.splice(2, 1); // Drop oldest messages after system and compacted summary
                finalTokens = this.estimateTokens(finalizedHistory);
            }
            console.error(`[ContextManager] ✅ Truncation complete. Safe token density achieved: ${finalTokens}`);
        }
        return finalizedHistory;
    } catch (e) {
        console.error(`[ContextManager] Compaction failed: ${e.message}. Falling back to simple truncation.`);
        let finalizedHistory = [systemMessage, ...toKeep].filter(Boolean);
        let finalTokens = this.estimateTokens(finalizedHistory);
        if (finalTokens > this.tokenLimit) {
            while (finalizedHistory.length > 2 && finalTokens > this.tokenLimit) {
                finalizedHistory.splice(1, 1); // Drop oldest messages after system message
                finalTokens = this.estimateTokens(finalizedHistory);
            }
        }
        return finalizedHistory;
    }
  }
}

module.exports = { ContextManager };
