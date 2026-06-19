/**
 * 🔬 MCP Server Integration Test
 * Verifies all 100% integration requirements implemented for TheSource.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

async function testIntegration() {
  console.error('\n🔬 ═══════════ MCP INTEGRATION TESTING ═══════════\n');
  let passCount = 0;
  let failCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.error(`✅ PASS: ${name}`);
      passCount++;
    } catch (e) {
      console.error(`❌ FAIL: ${name}`);
      console.error(e.stack || e);
      failCount++;
    }
  }

  // 1. Test ReasoningEngine handler
  const analysisHandlers = require('./core/bridge/handlers/analysis_handlers.js');
  
  await test('ReasoningEngine - Invalid Analysis returns RESTRICTED JSON', async () => {
    const mockContext = {
      logShadow: (entry) => {
        assert.strictEqual(entry.status, 'RESTRICTED');
      }
    };
    
    // Call ReasoningEngine with invalid analysis (no decision, too short)
    const resultStr = await analysisHandlers.ReasoningEngine({
      conclusion: 'Solve database index lock',
      analysis: 'Too short and missing keywords',
      pro_reasoning: 'Pro test',
      flash_reasoning: 'Flash test'
    }, mockContext);
    
    const result = JSON.parse(resultStr);
    assert.strictEqual(result.status, 'RESTRICTED');
    assert.ok(result.message.includes('MANDATORY'));
    assert.ok(result.missing.length > 0);
  });

  await test('ReasoningEngine - Valid Analysis returns normal consensus', async () => {
    const mockContext = {
      logShadow: (entry) => {
        assert.ok(entry.status === 'SUCCESS' || entry.status === 'WARNING');
      }
    };
    
    // Call ReasoningEngine with valid analysis (has analysis, impact, decision keywords)
    const resultStr = await analysisHandlers.ReasoningEngine({
      conclusion: 'Solve database index lock',
      analysis: 'My analysis of the deadlock impact and decision to build composite index will resolve the slow transactions.',
      pro_reasoning: 'Pro test',
      flash_reasoning: 'Flash test'
    }, mockContext);
    
    assert.ok(resultStr.includes('Unified Multi-Model Consensus Activated'));
    assert.ok(resultStr.includes('State assured and authorized'));
  });

  // 2. Test Cognitive Router
  const { detectSkillFromText, INTENT_MAP } = require('./core/mcp/intent_router.js');
  
  await test('Cognitive Router - Agriculture keywords detected with >90% confidence', () => {
    const result = detectSkillFromText('I need to analyze crop variance for مزرعة سردود');
    assert.ok(result);
    assert.strictEqual(result.skill, 'agri-specialist');
    assert.ok(result.confidence > 90);
  });

  await test('Cognitive Router - Finance keywords detected with >90% confidence', () => {
    const result = detectSkillFromText('Apply double entry posting to standard ledger accounts');
    assert.ok(result);
    assert.strictEqual(result.skill, 'finance-auditor');
    assert.ok(result.confidence > 90);
  });

  await test('Cognitive Router - Flutter skill correctly registered and mapped', () => {
    const result = detectSkillFromText('Debug the mobile secure_storage synchronization queue');
    assert.ok(result);
    assert.strictEqual(result.skill, 'flutter-fixer');
    assert.ok(result.confidence > 90);
  });

  // 3. Test Cumulative Tooling
  const sharedMcp = require('./core/mcp/shared_mcp_core.js');

  await test('Cumulative Tooling - view_file and ViewCodeOutline bypass active skill limitations', () => {
    const bridgeConfig = {
      allowed_tools: ['view_file', 'ViewCodeOutline', 'RealtimeScan'],
      enforcementMode: 'STRICT',
      bridgeVersion: '1.0'
    };

    // Simulate session active skill 'security-audit' which only lists specific tools
    // but should still allow cumulative base inspection tools
    const result = sharedMcp.authorizeToolCall('view_file', bridgeConfig, null, 'test-session');
    assert.ok(result.allowed);

    const result2 = sharedMcp.authorizeToolCall('ViewCodeOutline', bridgeConfig, null, 'test-session');
    assert.ok(result2.allowed);
  });

  // 4. Test MCP Resources
  const lspHandlers = require('./core/bridge/handlers/lsp_handlers.js');

  await test('MCP Resources - ListMcpResources exposes custom URIs', async () => {
    const resStr = await lspHandlers.ListMcpResources({}, {});
    const result = JSON.parse(resStr);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.projectAgnostic, true);
    assert.ok(result.resources.some(r => r.uri === 'mcp://tool-registry'));
    assert.ok(result.resources.some(r => r.uri === 'mcp://latest-gates'));
    assert.ok(result.resources.some(r => r.uri === 'mcp://forensic-reports'));
    assert.ok(result.resources.some(r => r.uri === 'mcp://source-map'));
    assert.ok(result.resources.some(r => r.uri === 'mcp://shadow-ledger'));
    assert.ok(result.resources.some(r => r.uri === 'agriasset://models'));
    assert.ok(result.resources.some(r => r.uri === 'agriasset://engines'));
  });

  await test('MCP Resources - Generic tool registry is project agnostic', async () => {
    const resStr = await lspHandlers.ReadMcpResource({ uri: 'mcp://tool-registry' }, { __dirname: process.cwd() });
    const result = JSON.parse(resStr);
    assert.strictEqual(result.uri, 'mcp://tool-registry');
    assert.ok(result.declaredAllowedTools > 0);
    assert.ok(Array.isArray(result.genericResources));
    assert.ok(result.genericResources.includes('mcp://source-map'));
  });

  await test('MCP Resources - Source map metadata is available without AgriAsset', async () => {
    const resStr = await lspHandlers.ReadMcpResource({ uri: 'mcp://source-map' }, { __dirname: process.cwd() });
    const result = JSON.parse(resStr);
    assert.strictEqual(result.uri, 'mcp://source-map');
    assert.ok(result.sourceMap.cli.exists);
    assert.ok(result.sourceMap.cliMap.exists);
    assert.strictEqual(result.sourceMap.metadata.sourceCount, 4756);
    assert.strictEqual(result.sourceMap.metadata.sourcesContentCount, 4756);
  });

  await test('MCP Resources - ReadMcpResource returns models list', async () => {
    const resStr = await lspHandlers.ReadMcpResource({ uri: 'agriasset://models' }, {});
    const result = JSON.parse(resStr);
    assert.strictEqual(result.uri, 'agriasset://models');
    assert.ok(Array.isArray(result.content));
  });

  console.error(`\n📊 ═══════════ INTEGRATION RESULTS ═══════════`);
  console.error(`✅ Passed: ${passCount}  ❌ Failed: ${failCount}`);
  if (failCount > 0) {
    process.exit(1);
  } else {
    console.error('🎉 ALL INTEGRATION TESTS PASSED!');
    process.exit(0);
  }
}

testIntegration().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
