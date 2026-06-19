const fs = require('fs');
const path = require('path');

const searchDir = 'src';
const featuresToLiberate = [
    'KAIROS', 'ULTRATHINK', 'VOICE_MODE', 'PROACTIVE', 
    'CONTEXT_COLLAPSE', 'REACTIVE_COMPACT', 'DAEMON', 
    'BRIDGE_MODE', 'QUICK_SEARCH', 'TERMINAL_PANEL'
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(searchDir);
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    featuresToLiberate.forEach(feat => {
        const regex = new RegExp(`feature\\(['"]${feat}['"]\\)`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, 'true /* Sovereign Liberated */');
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(file, content);
        console.error(`🚀 Liberated Features in: ${file}`);
        count++;
    }
});

console.error(`\n--- FEATURE LIBERATION COMPLETE: ${count} FILES FREED ---`);
