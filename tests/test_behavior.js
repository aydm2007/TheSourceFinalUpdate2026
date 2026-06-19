// test_behavior.js — Aether Engine Behavior Tests
// These tests verify real behavior end-to-end with mock injection
// Run: node test_behavior.js

const assert = require('assert');
const path = require('path');
const fs = require('fs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}`); console.log(`     Error: ${e.message}`); }
}

async function asyncTest(name, fn) {
  try { await fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name}`); console.log(`     Error: ${e.message}`); }
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
  'AETHER_RELAY_KEY_ALPHA',
  'AETHER_RELAY_KEY_BETA',
  'GITHUB_MODELS_TOKEN',
  'GITHUB_MODELS_URL',
  'AETHER_PROVIDER',
  'AETHER_MODEL',
  'AETHER_PLANNER_MODEL',
  'AETHER_EXECUTOR_MODEL',
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

// ============ MOCK INFRASTRUCTURE ============

function createMockFetch(responses) {
  let callIndex = 0;
  const calls = [];
  const mockFn = async (url, options) => {
    const call = { url, body: JSON.parse(options.body), headers: options.headers };
    calls.push(call);
    const resp = responses[callIndex] || responses[responses.length - 1];
    callIndex++;
    return resp;
  };
  mockFn.calls = calls;
  mockFn.callCount = () => calls.length;
  return mockFn;
}

function okResponse(content = 'Hello', model = 'deepseek-ai/DeepSeek-V3') {
  return {
    ok: true, status: 200,
    json: async () => ({
      id: `resp-${Date.now()}`, model,
      choices: [{ message: { content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 }
    })
  };
}

function errResponse(status = 500, body = 'Server Error') {
  return { ok: false, status, text: async () => body };
}

function createTestBridge(mockFetch) {
  const adapterCode = fs.readFileSync(path.join(__dirname, '../relay_bridge.js'), 'utf8');
  // Inject mock fetch by wrapping in a function
  const moduleWrapper = new Function('fetch', 'module', 'exports', 'require', 'process', '__dirname', adapterCode);
  const testModule = { exports: {} };
  
  // Custom require to fix relative paths since relay_bridge is in parent dir
  const customRequire = (id) => {
    if (id.startsWith('./')) {
      return require(path.join(__dirname, '..', id));
    }
    return require(id);
  };

  moduleWrapper(mockFetch, testModule, testModule.exports, customRequire, process, path.join(__dirname, '..'));
  
  const { RelayBridge } = testModule.exports;
  const bridge = new RelayBridge('test-api-key-12345');
  bridge.retryDelayMs = 1;
  return bridge;
}

// ============ BEHAVIOR TESTS ============

async function runTests() {
  clearEnv();
  console.log('\n📊 Aether Engine — Sovereign Behavior Tests\n');
  console.log('─'.repeat(50));

  // ── §1. createPulse: Success Path ──
  console.log('\n🎯 createPulse Success Path:');

  await asyncTest('should call Relay API with correct URL', async () => {
    const mock = createMockFetch([okResponse()]);
    const bridge = createTestBridge(mock);
    await bridge.createPulse({ messages: [{ role: 'user', content: 'test' }] });
    assert.strictEqual(mock.calls[0].url, 'https://api.siliconflow.com/v1/chat/completions');
  });

  await asyncTest('should send Bearer token in Authorization header', async () => {
    const mock = createMockFetch([okResponse()]);
    const bridge = createTestBridge(mock);
    await bridge.createPulse({ messages: [{ role: 'user', content: 'test' }] });
    assert.strictEqual(mock.calls[0].headers['Authorization'], 'Bearer test-api-key-12345');
  });

  // ── §2. Response Format Conversion ──
  console.log('\n🔄 Response Format Conversion:');

  await asyncTest('should convert response to Sovereign format', async () => {
    const mock = createMockFetch([okResponse('Valid Result')]);
    const bridge = createTestBridge(mock);
    const result = await bridge.createPulse({ messages: [{ role: 'user', content: 'test' }] });
    assert.strictEqual(result.type, 'message');
    assert.strictEqual(result.content[0].text, 'Valid Result');
  });

  // ── §3. Structural Checks ──
  console.log('\n🏛️ Structural Integrity:');

  test('master.md should exist in core/protocols/nexus-core', () => {
    assert.ok(fs.existsSync(path.join(__dirname, '../core/protocols/nexus-core/master.md')));
  });

  test('AETHER.md should have Sovereign identity', () => {
    const aether = fs.readFileSync(path.join(__dirname, '../AETHER.md'), 'utf8');
    assert.ok(aether.includes('Aether Engine'));
    assert.ok(aether.includes('Aether-Prime'));
  });

  test('ToolOrchestrator FileWrite should create missing parent directories', () => {
    const { ToolOrchestrator } = require('../core/utils/tool_orchestrator.js');
    const scratchRoot = path.join(__dirname, '../scratch/filewrite-parent-test');
    const nestedFile = 'nested/deep/probe.txt';
    fs.rmSync(scratchRoot, { recursive: true, force: true });

    const orchestrator = new ToolOrchestrator(scratchRoot);
    const result = orchestrator.fileWrite(nestedFile, 'ok');
    assert.ok(result.includes('Successfully wrote'));
    assert.strictEqual(fs.readFileSync(path.join(scratchRoot, nestedFile), 'utf8'), 'ok');

    fs.rmSync(scratchRoot, { recursive: true, force: true });
  });

  // ── Summary ──
  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed === 0) {
    console.log('✅ ALL BEHAVIOR TESTS PASSED!\n');
    restoreEnv();
  } else {
    console.log(`❌ ${failed} test(s) failed!\n`);
    restoreEnv();
    process.exit(1);
  }
}

runTests().catch(e => { console.error('Test runner error:', e); process.exit(1); });
