// test_all_tools_atomic.js — اختبار ذري شامل لجميع أدوات النيكسوس بريج
// التاريخ: 2026-05-20 | الهدف: تقييم 100% لكل أداة

const { executeTool } = require('../nexus_bridge.js');
const fs = require('fs');
const path = require('path');

const results = [];
let passed = 0;
let failed = 0;

async function testTool(name, args, validator) {
    const start = Date.now();
    try {
        const result = await executeTool(name, args);
        const duration = Date.now() - start;
        const ok = validator(result);
        const status = ok ? '✅ نجاح' : '⚠️ نتيجة غير متوقعة';
        if (ok) passed++; else failed++;
        results.push({ tool: name, status, duration: `${duration}ms`, preview: String(result).substring(0, 120) });
        console.error(`${ok ? '✅' : '⚠️'} ${name} — ${duration}ms`);
    } catch (e) {
        const duration = Date.now() - start;
        failed++;
        results.push({ tool: name, status: '❌ فشل', duration: `${duration}ms`, preview: e.message.substring(0, 120) });
        console.error(`❌ ${name} — ${e.message.substring(0, 80)}`);
    }
}

(async () => {
    console.error('\n═══════════════════════════════════════════════════');
    console.error('  🔬 الاختبار الذري الشامل لأدوات النيكسوس بريج');
    console.error('═══════════════════════════════════════════════════\n');

    // 1. FileRead
    await testTool('FileRead', { file_path: 'package.json' }, r => r && r.includes('aether-engine'));

    // 2. FileReadLines
    await testTool('FileReadLines', { file_path: 'package.json', start_line: 1, end_line: 5 }, r => r && r.length > 0);

    // 3. FileWrite (ملف مؤقت)
    await testTool('FileWrite', { file_path: 'scratch/test_write_probe.txt', content: 'AETHER-PROBE-OK' }, r => r && r.includes('SUCCESS'));

    // 4. FileEdit (تعديل الملف المؤقت)
    await testTool('FileRead', { file_path: 'scratch/test_write_probe.txt' }, r => true); // لتسجيل الملف في السياق
    await testTool('FileEdit', { file_path: 'scratch/test_write_probe.txt', old_string: 'AETHER-PROBE-OK', new_string: 'AETHER-PROBE-EDITED' }, r => r && r.includes('SUCCESS'));

    // 5. Glob
    await testTool('Glob', { pattern: '*.js' }, r => r && r.includes('nexus_bridge.js'));

    // 6. Grep
    await testTool('Grep', { pattern: 'RelayBridge', path: 'relay_bridge.js' }, r => r && r.includes('RelayBridge'));

    // 7. Bash
    await testTool('Bash', { command: 'echo SOVEREIGN_ACTIVE' }, r => r && r.includes('SOVEREIGN_ACTIVE'));

    // 8. OmegaDiagnostic (استدعاء مباشر)
    await testTool('OmegaDiagnostic', {}, r => r && r.includes('KAIROS'));

    // 9. ZodSchema
    await testTool('ZodSchema', { schema_name: 'TestProbe', fields: { name: { type: 'string' }, age: { type: 'number' } } }, r => r && r.length > 0);

    // 10. TodoWrite
    await testTool('TodoWrite', { task: 'AtomicTestProbe', logic_description: 'فحص ذري للأداة' }, r => r && r.length > 0);

    // 11. TaskCreate
    await testTool('TaskCreate', { title: 'اختبار ذري', description: 'فحص شامل لأدوات المنظومة' }, r => r && r.length > 0);

    // 12. ServerMode
    await testTool('ServerMode', { port: 9999 }, r => r && r.length > 0);

    // 13. VisualAuditReport
    await testTool('VisualAuditReport', { report_data: { maturity_score: 95, production_ready: 90, recommendation: 'جاهز للإنتاج' } }, r => r && r.length > 0);

    // 14. SemanticReference
    await testTool('SemanticReference', { symbol_name: 'RelayBridge' }, r => r && r.length > 0);

    // 15. ViewCodeOutline
    await testTool('ViewCodeOutline', { file_path: 'relay_bridge.js' }, r => r && r.includes('RelayBridge'));

    // 16. FeatureFlag
    await testTool('FeatureFlag', { flag_name: 'NEXUS_TOOLS', status: 'true' }, r => r && r.length > 0);

    // 17. ToolSearch
    await testTool('ToolSearch', { query: 'file' }, r => r && r.length > 0);

    // 18. SurgicalDiff
    await testTool('FileRead', { file_path: 'scratch/test_write_probe.txt' }, r => true);
    await testTool('SurgicalDiff', { file_path: 'scratch/test_write_probe.txt', search_block: 'AETHER-PROBE-EDITED', replace_block: 'AETHER-PROBE-FINAL' }, r => r && (r.includes('SUCCESS') || r.includes('applied')));

    // 19. SemanticSymbolLookup
    await testTool('SemanticSymbolLookup', { symbol: 'executeTool' }, r => r && r.includes('executeTool'));

    // 20. AstIndexer
    await testTool('AstIndexer', { scan_path: '.', output_index_path: 'scratch/ast_index_test.json' }, r => r && r.includes('Indexing'));

    // 21. SemanticContextCompressor
    await testTool('SemanticContextCompressor', { file_path: 'relay_bridge.js', compression_level: 'medium' }, r => r && r.includes('Compressed'));

    // 22. Config
    await testTool('Config', { action: 'get', key: 'AETHER_PROVIDER' }, r => r && r.length > 0);

    // 23. Sleep
    await testTool('Sleep', { duration_ms: 100 }, r => r && r.length > 0);

    // تنظيف
    try { fs.unlinkSync(path.join(__dirname, '..', 'scratch', 'test_write_probe.txt')); } catch(e) {}
    try { fs.unlinkSync(path.join(__dirname, '..', 'scratch', 'ast_index_test.json')); } catch(e) {}

    console.error('\n═══════════════════════════════════════════════════');
    console.error(`  📊 النتائج: ${passed} نجاح | ${failed} فشل | الإجمالي: ${passed + failed}`);
    console.error(`  📈 معدل النجاح: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.error('═══════════════════════════════════════════════════\n');

    // حفظ النتائج
    const report = {
        timestamp: new Date().toISOString(),
        total: passed + failed,
        passed, failed,
        success_rate: `${((passed / (passed + failed)) * 100).toFixed(1)}%`,
        results
    };
    fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'atomic_tools_test_results.json'), JSON.stringify(report, null, 2));
    console.error('💾 تم حفظ النتائج في: scratch/atomic_tools_test_results.json');
})();
