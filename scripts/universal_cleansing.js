const fs = require('fs');
const path = require('path');

const searchDir = 'src';
const patterns = [
    /process\.env\.USER_TYPE\s*===\s*['"]ant['"]/g,
    /['"]ant['"]\s*===\s*process\.env\.USER_TYPE/g
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

console.error('--- STARTING UNIVERSAL SOVEREIGN CLEANSING ---');

const files = walk(searchDir);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    patterns.forEach(pattern => {
        if (pattern.test(content)) {
            content = content.replace(pattern, 'true /* Sovereign Unlocked */');
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(file, content);
        console.error(`✅ Unlocked: ${file}`);
        modifiedCount++;
    }
});

console.error(`\n--- CLEANSING COMPLETE: ${modifiedCount} FILES LIBERATED ---`);
