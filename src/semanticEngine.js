// src/semanticEngine.js
// Minimal semantic document translation and error‑mapping engine.
// This stub provides two core functions:
//   1. translateDocument(sourceText, targetLang) – uses a placeholder
//      translation routine (to be replaced with a real LLM or API).
//   2. mapErrors(sourceText, translatedText) – aligns the original and
//      translated strings and returns a list of mismatch/error objects.
// The implementation is deliberately lightweight and pure‑JS so it can be
// executed in any Node environment without external dependencies.

/**
 * Simple word‑by‑word dictionary‑based translator.
 * In a production system you would call an external LLM or translation API.
 * Here we provide a deterministic stub for testing and integration.
 *
 * @param {string} sourceText – The original document.
 * @param {string} targetLang – ISO‑639‑1 language code (e.g. "es", "fr").
 * @returns {string} – Pseudo‑translated text.
 */
function translateDocument(sourceText, targetLang) {
  // Very small built‑in dictionary for demonstration purposes.
  const dict = {
    es: {
      hello: "hola",
      world: "mundo",
      "good morning": "buenos días",
      "thank you": "gracias",
      error: "error",
      warning: "advertencia",
    },
    fr: {
      hello: "bonjour",
      world: "monde",
      "good morning": "bonjour",
      "thank you": "merci",
      error: "erreur",
      warning: "avertissement",
    },
    // Add more languages as needed.
  };

  const lower = sourceText.toLowerCase();
  const languageDict = dict[targetLang] || {};
  // Replace known phrases; fallback to original word.
  return lower.replace(/\b\w+(?: \w+)?\b/g, (word) => {
    return languageDict[word] || word;
  });
}

/**
 * Align original and translated texts and produce a simple error map.
 * The function walks both strings token by token and records mismatches.
 *
 * @param {string} sourceText – Original document.
 * @param {string} translatedText – Result of translateDocument.
 * @returns {Array<{index:number, source:string, translated:string}>}
 */
function mapErrors(sourceText, translatedText) {
  const srcTokens = sourceText.split(/\s+/);
  const trgTokens = translatedText.split(/\s+/);
  const errors = [];
  const len = Math.max(srcTokens.length, trgTokens.length);
  for (let i = 0; i < len; i++) {
    const src = srcTokens[i] || "";
    const trg = trgTokens[i] || "";
    if (src !== trg) {
      errors.push({ index: i, source: src, translated: trg });
    }
  }
  return errors;
}

module.exports = { translateDocument, mapErrors };
