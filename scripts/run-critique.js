const path = require('path');
const fs = require('fs');

const targetService = path.resolve(__dirname, './package/surgical_critique.js');
if (!fs.existsSync(targetService)) {
    console.error(`🚨 Fatal Error: Missing backend file at ${targetService}`);
    process.exit(1);
}

const { runSurgicalCritique } = require(targetService);

console.error("🚀 Launching Isolated Critique Engine...");

// دالة تشغيل معزولة لحماية واجهة الـ Promise
async function main() {
    try {
        // استدعاء مباشر ونظيف للمحرك الجراحي
        await runSurgicalCritique({
            target: "C:\\tools\\workspace\\TheSource\\src",
            fixAll: true,
            model: "gpt-oss-120b"
        });
        
        console.error("✅ Analysis Cycle Finished Successfully.");
        process.exit(0);
    } catch (err) {
        console.error("🚨 System Crash: ", err.message);
        process.exit(1);
    }
}

main();
