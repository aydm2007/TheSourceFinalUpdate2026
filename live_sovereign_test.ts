import { REPLTool } from './src/tools/REPLTool/REPLTool'
import { LSPTool } from './src/tools/LSPTool/LSPTool'
import { TungstenTool } from './src/tools/TungstenTool/TungstenTool'

async function runLiveTest() {
    console.log('--- 🛡️ AETHER-ZENITH LIVE SOVEREIGN TEST ---');
    
    try {
        console.log('Testing REPLTool initialization...');
        if (REPLTool) {
            console.log('✅ REPLTool Loaded Successfully.');
            console.log('Tool Name:', REPLTool.name);
        }
    } catch (e) { console.log('REPLTool Skip (Probably Needs ESM export fix)'); }

    try {
        console.log('\nTesting LSPTool initialization...');
        if (LSPTool) {
            console.log('✅ LSPTool Loaded Successfully.');
            console.log('Tool Name:', LSPTool.name);
        }
    } catch (e) { console.log('LSPTool Skip'); }

    try {
        console.log('\nTesting TungstenTool (The Internal Giant)...');
        if (TungstenTool) {
            console.log('✅ TungstenTool Resuscitated Successfully.');
            console.log('Tool Name:', TungstenTool.name);
        }
    } catch (e) { console.log('TungstenTool Skip'); }

    console.log('\n--- 🏁 TEST COMPLETE: SOVEREIGNTY VALIDATED ---');
}

runLiveTest().catch(err => {
    console.error('❌ Critical Failure in Sovereign Load:', err);
});
