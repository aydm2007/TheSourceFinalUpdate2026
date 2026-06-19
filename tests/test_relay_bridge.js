// test_relay_bridge.js — Aether Engine Core Logic Tests
// Run: node test_relay_bridge.js

const assert = require('assert');

// ==================== TEST SUITE ====================

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${e.message}`);
  }
}

// Environment isolation helper
const envVars = [
  'AETHER_SF_KEYS',
  'SILICONFLOW_KEYS',
  'SILICONFLOW_API_KEY_AYMAN',
  'SILICONFLOW_BASE_URL',
  'AETHER_OR_KEYS',
  'OPENROUTER_API_KEY',
  'OPENROUTER_KEYS',
  'OPENROUTER_BASE_URL',
  'OPENAI_API_KEY',
  'OPENAI_KEYS',
  'OPENAI_BASE_URL',
  'OPENAI_PLANNER_MODEL',
  'OPENAI_EXECUTOR_MODEL',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GEMINI_BASE_URL',
  'GOOGLE_GENERATIVE_AI_BASE_URL',
  'GEMINI_PLANNER_MODEL',
  'GEMINI_EXECUTOR_MODEL',
  'GOOGLE_PLANNER_MODEL',
  'GOOGLE_EXECUTOR_MODEL',
  'AETHER_RELAY_KEY_ALPHA',
  'AETHER_RELAY_KEY_BETA',
  'GITHUB_MODELS_TOKEN',
  'GITHUB_MODELS_URL',
  'AETHER_PROVIDER',
  'AETHER_MODEL',
  'AETHER_PLANNER_MODEL',
  'AETHER_EXECUTOR_MODEL',
  'AETHER_PLANNER_PROVIDER',
  'AETHER_EXECUTOR_PROVIDER',
  'SILICONFLOW_PLANNER_MODEL',
  'SILICONFLOW_EXECUTOR_MODEL',
  'OPENROUTER_PLANNER_MODEL',
  'OPENROUTER_EXECUTOR_MODEL',
  'GITHUB_PLANNER_MODEL',
  'GITHUB_EXECUTOR_MODEL',
  'AETHER_OPENROUTER_PATTERNS',
  'AETHER_MAX_RETRIES',
  'AETHER_RETRY_DELAY_MS',
  'AETHER_TIMEOUT_MS'
];

const backup = {};
for (const key of envVars) {
  backup[key] = process.env[key];
}

function clearEnv() {
  for (const key of envVars) {
    delete process.env[key];
  }
}

function restoreEnv() {
  for (const key of envVars) {
    if (backup[key] !== undefined) {
      process.env[key] = backup[key];
    } else {
      delete process.env[key];
    }
  }
}

async function runTests() {
  console.log('\n📊 Aether Engine — Core Relay Bridge Tests\n');
  console.log('─'.repeat(50));

  const { RelayBridge } = require('../relay_bridge.js');

  // --- Test 1: Constructor defaults ---
  console.log('\n🔧 Constructor Tests:');

  test('should use default model deepseek-ai/DeepSeek-V3', () => {
    clearEnv();
    const bridge = new RelayBridge('test-key');
    assert.strictEqual(bridge.model, 'deepseek-ai/DeepSeek-V3');
    restoreEnv();
  });

  test('should use env AETHER_MODEL if set', () => {
    clearEnv();
    process.env.AETHER_MODEL = 'Custom/Model';
    const bridge = new RelayBridge('test-key');
    assert.strictEqual(bridge.model, 'Custom/Model');
    restoreEnv();
  });

  test('should set correct API URL', () => {
    clearEnv();
    const bridge = new RelayBridge('test-key');
    assert.strictEqual(bridge.baseURL, 'https://api.siliconflow.com/v1/chat/completions');
    restoreEnv();
  });

  test('should fallback to env keys (Alpha/Beta)', () => {
    clearEnv();
    process.env.AETHER_RELAY_KEY_ALPHA = 'key-alpha';
    process.env.AETHER_RELAY_KEY_BETA = 'key-beta';
    const bridge = new RelayBridge();
    assert.strictEqual(bridge.apiKey, 'key-alpha');
    restoreEnv();
  });

  test('should normalize baseURL correctly', () => {
    clearEnv();
    const bridge = new RelayBridge('test-key');
    assert.strictEqual(bridge.normalizeBaseURL('https://api.siliconflow.com/v1'), 'https://api.siliconflow.com/v1/chat/completions');
    assert.strictEqual(bridge.normalizeBaseURL('https://api.siliconflow.com/v1/chat/completions/'), 'https://api.siliconflow.com/v1/chat/completions');
    restoreEnv();
  });

  test('should load provider-specific models from environment', () => {
    clearEnv();
    process.env.SILICONFLOW_KEYS = 'test-sf-key';
    process.env.SILICONFLOW_PLANNER_MODEL = 'sf-planner-123';
    process.env.SILICONFLOW_EXECUTOR_MODEL = 'sf-executor-456';
    const bridge = new RelayBridge();
    assert.strictEqual(bridge.plannerModel, 'sf-planner-123');
    assert.strictEqual(bridge.executiveModel, 'sf-executor-456');
    restoreEnv();
  });

  test('should translate models for siliconflow correctly', () => {
    clearEnv();
    const bridge = new RelayBridge('test-key');
    assert.strictEqual(bridge.mapModelForProvider('gemini-2.0-flash-exp:free', 'siliconflow'), 'deepseek-ai/DeepSeek-V4-Flash');
    assert.strictEqual(bridge.mapModelForProvider('deepseek-r1-chat', 'siliconflow'), 'deepseek-ai/DeepSeek-V4-Pro');
    assert.strictEqual(bridge.mapModelForProvider('qwen-2.5-coder-32b-instruct', 'siliconflow'), 'Qwen/Qwen3.6-35B-A3B');
    restoreEnv();
  });

  test('should translate models for github correctly', () => {
    clearEnv();
    const bridge = new RelayBridge('test-key');
    assert.strictEqual(bridge.mapModelForProvider('claude-3-5-sonnet', 'github'), 'gpt-4o');
    assert.strictEqual(bridge.mapModelForProvider('gemini-2.0-flash-exp:free', 'github'), 'gpt-4o-mini');
    restoreEnv();
  });

  test('should route OpenRouter free models without rewriting model ids', () => {
    clearEnv();
    process.env.AETHER_PROVIDER = 'openrouter';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.AETHER_MODEL = 'openai/gpt-oss-120b:free';
    const bridge = new RelayBridge();
    bridge.configureProviderForModel(process.env.AETHER_MODEL);
    assert.strictEqual(bridge.healthCheck().provider, 'openrouter');
    assert.strictEqual(bridge.mapModelForProvider('openai/gpt-oss-120b:free', 'openrouter'), 'openai/gpt-oss-120b:free');
    assert.strictEqual(bridge.mapModelForProvider('google/gemini-2.5-flash:free', 'openrouter'), 'google/gemini-2.5-flash:free');
    restoreEnv();
  });

  test('should route native OpenAI and Google models when native keys exist', () => {
    clearEnv();
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const bridge = new RelayBridge();

    bridge.configureProviderForModel('gpt-4o');
    assert.strictEqual(bridge.healthCheck().provider, 'openai');
    assert.strictEqual(bridge.mapModelForProvider('openai/gpt-4o', 'openai'), 'gpt-4o');

    bridge.configureProviderForModel('gemini-2.5-pro');
    assert.strictEqual(bridge.healthCheck().provider, 'google');
    assert.strictEqual(bridge.mapModelForProvider('google/gemini-2.5-pro', 'google'), 'gemini-2.5-pro');
    restoreEnv();
  });

  test('should inject TheSource deterministic execution contract into model calls', () => {
    clearEnv();
    const bridge = new RelayBridge('test-key');
    const messages = bridge.buildAdaptedMessages({
      model: 'openai/gpt-oss-120b:free',
      messages: [{ role: 'user', content: 'review this MCP patch and provide evidence' }],
      tools: [{ type: 'function', function: { name: 'FileRead' } }]
    });
    assert.strictEqual(messages[0].role, 'system');
    assert.ok(messages[0].content.includes('TheSource Deterministic Execution Contract'));
    assert.ok(messages[0].content.includes('Review passes required'));
    assert.ok(messages[0].content.includes('Never replace the user-selected model'));
    assert.ok(messages[0].content.includes('Opus-challenger'));
    restoreEnv();
  });

  test('should inject Opus-challenger protocols for previously weak axes', () => {
    clearEnv();
    const bridge = new RelayBridge('test-key');
    const deep = bridge.buildAdaptedMessages({
      model: 'openai/gpt-oss-120b:free',
      messages: [{ role: 'user', content: 'reason deeply with hypotheses and counterexamples' }],
      tools: []
    })[0].content;
    assert.ok(deep.includes('three hypotheses'));
    assert.ok(deep.includes('counterexamples'));
    assert.ok(deep.includes('98/100'));

    const review = bridge.buildAdaptedMessages({
      model: 'openai/gpt-oss-120b:free',
      messages: [{ role: 'user', content: 'code review this patch for regressions and edge cases' }],
      tools: []
    })[0].content;
    assert.ok(review.includes('two passes'));
    assert.ok(review.includes('Rank findings by severity'));

    const longContext = bridge.buildAdaptedMessages({
      model: 'openai/gpt-oss-120b:free',
      messages: [{ role: 'user', content: 'use long context, cli.js.map, source map anchors, and checkpoints' }],
      tools: []
    })[0].content;
    assert.ok(longContext.includes('source map of relevant files'));
    assert.ok(longContext.includes('compaction checkpoints'));

    const toolCall = bridge.buildAdaptedMessages({
      model: 'openai/gpt-oss-120b:free',
      messages: [{ role: 'user', content: 'natural tool intent with JSON schema arguments' }],
      tools: [{ type: 'function', function: { name: 'Grep' } }]
    })[0].content;
    assert.ok(toolCall.includes('minimal valid tool call'));
    assert.ok(toolCall.includes('validate schema'));
    restoreEnv();
  });

  test('should allow Qwen executor to run on SiliconFlow via explicit provider', () => {
    clearEnv();
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.SILICONFLOW_KEYS = 'test-siliconflow-key';
    process.env.AETHER_PROVIDER = 'openrouter';
    process.env.AETHER_PLANNER_MODEL = 'openai/gpt-oss-120b:free';
    process.env.AETHER_EXECUTOR_MODEL = 'Qwen/Qwen2.5-Coder-32B-Instruct';
    const bridge = new RelayBridge();

    bridge.useProvider('openrouter');
    assert.strictEqual(bridge.healthCheck().provider, 'openrouter');
    assert.strictEqual(bridge.mapModelForProvider(process.env.AETHER_PLANNER_MODEL, bridge.provider), 'openai/gpt-oss-120b:free');

    bridge.useProvider('siliconflow');
    assert.strictEqual(bridge.healthCheck().provider, 'siliconflow');
    assert.strictEqual(bridge.mapModelForProvider(process.env.AETHER_EXECUTOR_MODEL, bridge.provider), 'Qwen/Qwen3.6-35B-A3B');
    restoreEnv();
  });

  // --- Test 2: Response format logic ---
  console.log('\n🔄 Logic Verification:');

  test('should have dormant status when no key provided', () => {
    clearEnv();
    const bridge = new RelayBridge(null);
    assert.strictEqual(bridge.healthCheck().status, 'dormant');
    restoreEnv();
  });

  test('should have active status when key provided', () => {
    clearEnv();
    const bridge = new RelayBridge('live-key');
    assert.strictEqual(bridge.healthCheck().status, 'active');
    restoreEnv();
  });

  // --- Test 3: Module exports ---
  console.log('\n📦 Module Export Tests:');

  test('module should export RelayBridge', () => {
    const mod = require('../relay_bridge.js');
    assert.ok('RelayBridge' in mod);
  });

  // --- Test 4: JSON Repair ---
  console.log('\n🛠️ JSON Repair Tests:');

  const { repairJson } = require('../relay_bridge.js');

  test('should parse valid JSON normally', () => {
    const result = repairJson('{"key": "value"}');
    assert.deepStrictEqual(result, { key: 'value' });
  });

  test('should strip markdown formatting', () => {
    const result = repairJson('```json\n{"content": "hello"}\n```');
    assert.deepStrictEqual(result, { content: 'hello' });
  });

  test('should repair unescaped newlines in string literals', () => {
    const result = repairJson('{\n  "content": "line 1\nline 2"\n}');
    assert.deepStrictEqual(result, { content: 'line 1\nline 2' });
  });

  test('should balance open braces and brackets', () => {
    const result = repairJson('{"content": "hello", "list": [1, 2');
    assert.deepStrictEqual(result, { content: 'hello', list: [1, 2] });
  });

  test('should return raw arguments on failure', () => {
    const result = repairJson('{invalid}');
    assert.ok(result._parse_error);
    assert.strictEqual(result._raw_arguments, '{invalid}');
  });

  // --- Summary ---
  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  
  if (failed === 0) {
    console.log('✅ ALL CORE LOGIC TESTS PASSED!\n');
  } else {
    console.log(`❌ ${failed} test(s) failed!\n`);
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
