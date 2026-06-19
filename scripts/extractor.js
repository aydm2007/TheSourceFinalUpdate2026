const fs = require('fs');
const path = 'package/cli.js';
if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf8');
    const features = content.match(/feature\(['"](\w+)['"]\)/g) || [];
    console.error('--- FEATURES FOUND ---');
    console.error(JSON.stringify([...new Set(features)], null, 2));
    
    const userTypes = content.match(/process\.env\.USER_TYPE\s*===\s*['"](\w+)['"]/g) || [];
    console.error('--- USER TYPES FOUND ---');
    console.error(JSON.stringify([...new Set(userTypes)], null, 2));
} else {
    console.error('File not found: ' + path);
}
