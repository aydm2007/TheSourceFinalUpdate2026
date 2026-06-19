const fs = require('fs');
const path = require('path');

const filesToClean = [
    'src/utils/messages.ts',
    'src/utils/auth.ts',
    'src/utils/attachments.ts',
    'src/services/mcp/headersHelper.ts'
];

filesToClean.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('logAntError')) {
            content = content.replace(/import\s*\{\s*logAntError/g, 'import { logError as logAntError');
            content = content.replace(/from\s*['"]\.\.\/utils\/debug\.js['"]/g, 'from \'../utils/debug.js\'');
            // تأكد من أن الاستيراد يشير إلى debug.js أو log.js كما فعلنا في query.ts
            // في query.ts استبدلنا الاستيراد من debug.js بـ logError من نفس الملف عبر alias
            fs.writeFileSync(fullPath, content);
            console.error(`✅ Cleaned logAntError in: ${file}`);
        }
    }
});
