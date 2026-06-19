import { getAllBaseTools } from './src/tools'

async function finalCheck() {
    console.log('--- 🛡️ FINAL SOVEREIGN INTEGRITY CHECK ---');
    
    try {
        const tools = getAllBaseTools();
        console.log(`✅ Successfully loaded ${tools.length} sovereign tools.`);
        
        const toolNames = tools.map(t => t.name);
        console.log('Active Tools Matrix:', toolNames.join(', '));
        
        // التحقق من وجود الأدوات الحيوية
        const criticalTools = ['REPLTool', 'VerifyPlanExecutionTool', 'LSPTool', 'CtxInspectTool'];
        criticalTools.forEach(ct => {
            if (toolNames.includes(ct)) {
                console.log(`✨ Critical Tool Found: ${ct}`);
            } else {
                console.log(`⚠️ Warning: Critical Tool MISSING: ${ct}`);
            }
        });

        console.log('\n--- 🏁 STATUS: READY FOR PEER REVIEW ---');
    } catch (e) {
        console.error('❌ CRITICAL ARCHITECTURAL FAILURE:', e);
        process.exit(1);
    }
}

finalCheck();
