import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

const replacements = [
    { from: /\/api\/claude\.js/g, to: '/api/zenith.js' },
    { from: /tengu/g, to: 'sovereign' },
    { from: /Haiku/g, to: 'Flash' },
    { from: /Sonnet/g, to: 'Apex' },
    { from: /Opus/g, to: 'Prime' },
    { from: /Claude/g, to: 'Zenith' },
    { from: /Anthropic/g, to: 'Aether' }
];

walk('./src', (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        // الاستبدال المباشر والحتمي دون اختبار مشوه (تجنب فخ lastIndex)
        replacements.forEach(r => {
            content = content.replace(r.from, r.to);
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.error(`Sovereignized Safely: ${filePath}`);
        }
    }
});
