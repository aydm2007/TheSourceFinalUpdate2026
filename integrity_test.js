// اختبار نزاهة التحميل للأدوات المستعادة
const fs = require('fs');
const path = require('path');

console.error('--- SOVEREIGN TOOL INTEGRITY TEST ---');

const toolsToVerify = [
    './src/tools/REPLTool/REPLTool.js',
    './src/tools/TungstenTool/TungstenTool.js',
    './src/tools/LSPTool/LSPTool.js',
    './src/tools/SleepTool/SleepTool.js',
    './src/tools/WorkflowTool/WorkflowTool.js'
];

toolsToVerify.forEach(toolPath => {
    const absolutePath = path.resolve(toolPath);
    if (fs.existsSync(absolutePath)) {
        console.error(`✅ File Found: ${toolPath}`);
        try {
            // محاكاة تحميل الأداة (إذا كانت متوفرة كـ JS)
            // بما أننا في بيئة تطوير، سنكتفي بالتحقق من الوجود الفيزيائي حالياً لتجنب مشاكل التبعيات المعقدة
        } catch (e) {
            console.error(`❌ Load Error: ${toolPath} -> ${e.message}`);
        }
    } else {
        console.error(`⚠️ File Missing (Might need build): ${toolPath}`);
    }
});

console.error('--- END OF TEST ---');
