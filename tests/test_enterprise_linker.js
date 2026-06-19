const { EnterpriseLinker } = require('./core/utils/enterprise_linker.js');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing EnterpriseLinker...');

try {
    const linker = new EnterpriseLinker(__dirname);

    // Link existing files in workspace
    linker.registerLayerLink('Layer1_Core_IO', 'nexus_bridge.js');
    linker.registerLayerLink('Layer2_Execution_Shell', 'package.json');

    const result = linker.verifyLinks();
    console.log('Verification Result:', result);

    assert.strictEqual(result.verified, true, 'Link verification should pass for existing files');
    assert.strictEqual(result.score, 100, 'Score should be 100');

    // Test non-existing file
    try {
        linker.registerLayerLink('Layer3_Planning_Tasks', 'non_existing_file_xyz.js');
        assert.fail('Should throw error for non-existing files');
    } catch (e) {
        console.log('✅ Correctly threw error for missing file:', e.message);
    }

    console.log('🎉 EnterpriseLinker tests passed successfully!');
} catch (error) {
    console.error('❌ EnterpriseLinker tests failed:', error);
    process.exit(1);
}
