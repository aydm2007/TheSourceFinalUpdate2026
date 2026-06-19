import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
};

const fixes = [
    { from: /nexus\.internal/g, to: 'sovereign' }, 
    { from: /sovereign_PROFILE_SCOPE/g, to: 'SOVEREIGN_PROFILE_SCOPE' },
    { from: /sovereign_IN_CHROME/g, to: 'SOVEREIGN_IN_CHROME' }
];

walk('./src', (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
    
        fixes.forEach(r => {
            content = content.replace(r.from, r.to);
        });

    
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.error(`Fixed Safely: ${filePath}`);
        }
    }
});
