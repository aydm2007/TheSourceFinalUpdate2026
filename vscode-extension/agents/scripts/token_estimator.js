/**
 * 🟣 TokenEstimator — Sovereign Token Counter
 * Part of: Aether Engine V11.0 — Zero-Token Orchestration
 * 
 * Usage: node token_estimator.js "text" [--file=path] [--model=qwen|gemini|deepseek]
 * Bridge: TELEPATHY: tokenestimate → bridge.json
 * 
 * Supports: Qwen (BBPE), Gemini (SentencePiece), DeepSeek (BBPE)
 * Uses tiktoken-like approximation with model-specific ratios.
 */

const fs = require('fs');
const path = require('path');

// Model-specific tokenization ratios (characters per token, approximate)
const MODEL_RATIOS = {
  'qwen': { 
    name: 'Qwen 2.5-72B', 
    chars_per_token: 2.1,   // BBPE: ~2.1 chars/token for English, ~1.5 for Arabic
    arabic_factor: 1.4,      // Arabic uses ~1.4x more tokens
    code_factor: 0.85,       // Code uses fewer tokens
  },
  'gemini': { 
    name: 'Gemini Flash 3', 
    chars_per_token: 2.5,    // SentencePiece: more efficient
    arabic_factor: 1.3,
    code_factor: 0.8,
  },
  'deepseek': { 
    name: 'DeepSeek-V4', 
    chars_per_token: 2.2,    // BBPE variant
    arabic_factor: 1.35,
    code_factor: 0.85,
  },
  'default': {
    name: 'General (tiktoken cl100k)',
    chars_per_token: 3.0,    // Conservative estimate
    arabic_factor: 1.5,
    code_factor: 0.9,
  }
};

class TokenEstimator {
  constructor(model = 'default') {
    this.model = model;
    this.config = MODEL_RATIOS[model] || MODEL_RATIOS['default'];
  }

  estimate(text) {
    if (!text || text.length === 0) {
      return { tokens: 0, chars: 0, model: this.config.name };
    }

    const chars = text.length;
    
    // Detect language mix
    const arabicChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
    const codeChars = (text.match(/[{}\[\]();=><|&!+\-*/%]/g) || []).length;
    const arabicRatio = arabicChars / chars;
    const codeRatio = codeChars / chars;

    // Calculate effective ratio
    let effectiveRatio = this.config.chars_per_token;
    if (arabicRatio > 0.3) {
      effectiveRatio *= (1 + (this.config.arabic_factor - 1) * arabicRatio);
    }
    if (codeRatio > 0.2) {
      effectiveRatio *= (1 + (this.config.code_factor - 1) * codeRatio * 0.5);
    }

    const tokens = Math.ceil(chars / effectiveRatio);

    return {
      tokens,
      chars,
      model: this.config.name,
      model_key: this.model,
      ratio: Math.round(effectiveRatio * 100) / 100,
      breakdown: {
        arabic_pct: Math.round(arabicRatio * 100),
        code_pct: Math.round(codeRatio * 100),
        english_pct: Math.round((1 - arabicRatio - codeRatio * 0.3) * 100)
      }
    };
  }

  estimateFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const result = this.estimate(content);
      return {
        ...result,
        file: filePath,
        size_kb: Math.round(content.length / 1024 * 100) / 100
      };
    } catch (err) {
      return {
        error: err.message,
        file: filePath,
        tokens: 0
      };
    }
  }

  compareModels(text) {
    const results = {};
    for (const [key, config] of Object.entries(MODEL_RATIOS)) {
      const estimator = new TokenEstimator(key);
      results[key] = estimator.estimate(text);
    }
    return results;
  }

  costEstimate(tokens, model = this.model) {
    // Approximate costs per 1M tokens (as of 2026-05)
    const COSTS = {
      'qwen': { input: 0, output: 0, note: 'مجاني عبر SiliconFlow' },
      'gemini': { input: 0.15, output: 0.60, note: 'Flash 3 pricing' },
      'deepseek': { input: 0.14, output: 0.28, note: 'DeepSeek-V4 pricing' },
      'default': { input: 1.0, output: 3.0, note: 'Conservative estimate' }
    };

    const cost = COSTS[model] || COSTS['default'];
    return {
      tokens,
      model: MODEL_RATIOS[model]?.name || 'Unknown',
      input_cost_usd: Math.round(tokens / 1_000_000 * cost.input * 10000) / 10000,
      output_cost_usd: Math.round(tokens / 1_000_000 * cost.output * 10000) / 10000,
      note: cost.note
    };
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const modelArg = args.find(a => a.startsWith('--model='));
  const model = modelArg ? modelArg.split('=')[1] : 'default';
  const fileArg = args.find(a => a.startsWith('--file='));
  const compareFlag = args.includes('--compare');
  const costFlag = args.includes('--cost');

  const estimator = new TokenEstimator(model);

  if (fileArg) {
    const filePath = fileArg.split('=')[1];
    const result = estimator.estimateFile(filePath);
    console.log(JSON.stringify(result, null, 2));
  } else if (compareFlag) {
    const text = args.find(a => !a.startsWith('--')) || '';
    const result = estimator.compareModels(text);
    console.log(JSON.stringify(result, null, 2));
  } else {
    const text = args.find(a => !a.startsWith('--')) || '';
    const result = estimator.estimate(text);
    
    if (costFlag) {
      result.cost = estimator.costEstimate(result.tokens, model);
    }
    
    console.log(JSON.stringify(result, null, 2));
  }
}

module.exports = { TokenEstimator, MODEL_RATIOS };
