const ArabicErrorMapper = require('../core/diagnostics/arabic_error_mapper');
const path = require('path');

async function testPatching() {
    console.error("🧪 Running Arabic localized diagnostic and patching test...");
    const mockError = new Error("EADDRINUSE: port already in use 9999");
    mockError.code = 'EADDRINUSE';

    const targetFile = path.join(__dirname, '../core/dashboard/sovereign_dashboard.js');
    console.error(`Target file for mock diagnosis: ${targetFile}`);

    try {
        const result = await ArabicErrorMapper.diagnoseAndPatch(mockError, targetFile);
        console.error("✅ Diagnostic & Patch Suggestion generated successfully!");
        console.error(`Error: ${result.error}`);
        console.error(`Arabic Translation: ${result.translation_ar}`);
        console.error(`Explanation: ${result.explanation_ar}`);
        console.error(`Patch Suggested: ${result.patch_suggested}`);
        console.error(`Proposed Code (First 150 chars):\n${result.proposed_code.substring(0, 150)}...`);
        console.error(`CoT Trace (First 150 chars):\n${result.cot_trace.substring(0, 150)}...`);

        if (result.proposed_code && result.translation_ar.includes('المنفذ المطلوب')) {
            console.error("\n🎉 TEST PASSED SUCCESSFULLY!");
            process.exit(0);
        } else {
            console.error("\n❌ TEST FAILED: Verification criteria not met.");
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ TEST FAILED with error:", e);
        process.exit(1);
    }
}

testPatching();
