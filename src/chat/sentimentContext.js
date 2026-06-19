/*
 * Sentiment & Context Analysis Module
 * -----------------------------------
 * This module provides two main utilities for the chat system:
 *   1. `analyzeSentiment(message)` – returns a simple sentiment score
 *      ranging from -1 (negative) to +1 (positive). It uses the
 *      `sentiment` npm package under the hood.
 *   2. `extractContext(messages, windowSize = 5)` – builds a context
 *      window from the most recent messages to be used for prompt
 *      engineering. It returns a concatenated string of the last
 *      `windowSize` messages.
 *
 * The implementation is deliberately lightweight and has no external
 * runtime dependencies besides the already‑installed `sentiment`
 * package. If the package is missing, the function falls back to a
 * very naive keyword‑based sentiment analysis to avoid breaking the
 * chat flow.
 */

const Sentiment = require('sentiment');
const sentimentAnalyzer = new Sentiment();

/**
 * Analyze the sentiment of a single chat message.
 * @param {string} message - The chat message to analyze.
 * @returns {number} Sentiment score between -1 (negative) and +1 (positive).
 */
function analyzeSentiment(message) {
  if (!message || typeof message !== 'string') return 0;
  try {
    const result = sentimentAnalyzer.analyze(message);
    // Normalize the score to the -1..1 range based on typical sentiment bounds.
    const maxAbs = Math.max(Math.abs(result.comparative), 5);
    return Math.max(-1, Math.min(1, result.comparative / maxAbs));
  } catch (e) {
    // Fallback: simple keyword matching
    const lower = message.toLowerCase();
    const positive = ['good', 'great', 'awesome', 'nice', 'love', 'thanks'];
    const negative = ['bad', 'terrible', 'hate', 'sad', 'angry', 'upset'];
    let score = 0;
    positive.forEach(w => { if (lower.includes(w)) score += 1; });
    negative.forEach(w => { if (lower.includes(w)) score -= 1; });
    return Math.max(-1, Math.min(1, score / 5));
  }
}

/**
 * Extract a contextual window from an array of chat messages.
 * @param {Array<{author:string, text:string}>} messages - Full chat history.
 * @param {number} [windowSize=5] - Number of most recent messages to include.
 * @returns {string} Concatenated context string.
 */
function extractContext(messages, windowSize = 5) {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  const slice = messages.slice(-windowSize);
  return slice.map(m => `${m.author}: ${m.text}`).join('\n');
}

module.exports = {
  analyzeSentiment,
  extractContext
};
