const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(process.cwd(), 'src');
const PATTERNS = [/TODO/g, /FIXME/g, /HACK/g];

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules') scanDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            PATTERNS.forEach(pattern => {
                if (pattern.test(content)) {
                    console.error(`[DEBT FOUND] ${fullPath}`);
                }
            });
        }
    });
}

console.error('--- Starting Sovereign Debt Scan ---');
scanDir(TARGET_DIR);
console.error('--- Scan Complete ---');
