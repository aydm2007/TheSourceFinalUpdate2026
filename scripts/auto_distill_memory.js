const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.error('🧠 [Aether-Memory] Initiating semantic index curation...');

const memoryDir = path.join(__dirname, '..', '.agents', 'memory');

try {
    // 1. Ensure required memory files exist
    const requiredFiles = ['decisions.md', 'patterns.md', 'bugs.md'];
    requiredFiles.forEach(file => {
        const filePath = path.join(memoryDir, file);
        if (!fs.existsSync(filePath)) {
            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
            }
            fs.writeFileSync(filePath, `# 📋 ${file.replace('.md', '')}\n<!-- APPEND -->\n`, 'utf8');
            console.error(`+ Created missing memory anchor: ${file}`);
        }
    });

    // 2. Refresh the vector index
    console.error('🔄 Re-indexing vector memory scopes...');
    const refreshScript = path.join(__dirname, 'refresh_index.js');
    if (fs.existsSync(refreshScript)) {
        execSync(`node "${refreshScript}"`, { stdio: 'inherit' });
    } else {
        console.error('⚠️ refresh_index.js not found, skipping vector re-indexing.');
    }

    console.error('✅ [Memory] Semantic curation cycle completed successfully.');
} catch (error) {
    console.error('❌ [Memory Error] Failed to complete curation cycle:', error.message);
    process.exit(1);
}
