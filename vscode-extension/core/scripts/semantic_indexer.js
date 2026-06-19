/**
 * semantic_indexer.js — Aether Sovereign Semantic Mapping Tool
 * Version: 1.0-Omega
 * Purpose: Recursively index classes, functions, and models across the project.
 */

const fs = require('fs');
const path = require('path');

const TARGET_EXTENSIONS = ['.py', '.js', '.dart', '.sql', '.md'];
const EXCLUDE_DIRS = ['node_modules', '.git', '__pycache__', 'dist', 'build'];
const PROJECT_ROOT = process.env.AGRIASSET_PATH || 'C:/tools/workspace/AgriAsset_YECO_Enterprise2026';

const REGEX_PATTERNS = {
    class: /class\s+([a-zA-Z0-9_]+)/g,
    function: /(?:def|async function|function)\s+([a-zA-Z0-9_]+)/g,
    model: /class\s+([a-zA-Z0-9_]+)\(models\.Model\)/g,
    url: /path\(['"]([^'"]+)['"]/g
};

const index = {
    classes: [],
    functions: [],
    models: [],
    urls: [],
    metadata: {
        last_scan: new Date().toISOString(),
        files_scanned: 0
    }
};

function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`[Warning] Path not found: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                scanDirectory(fullPath);
            }
        } else {
            const ext = path.extname(file);
            if (TARGET_EXTENSIONS.includes(ext)) {
                indexFile(fullPath);
            }
        }
    }
}

function indexFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    index.metadata.files_scanned++;

    // Extract Classes
    let match;
    while ((match = REGEX_PATTERNS.class.exec(content)) !== null) {
        index.classes.push({ name: match[1], path: relativePath });
    }

    // Extract Functions
    while ((match = REGEX_PATTERNS.function.exec(content)) !== null) {
        index.functions.push({ name: match[1], path: relativePath });
    }

    // Extract Models (Special for Django)
    while ((match = REGEX_PATTERNS.model.exec(content)) !== null) {
        index.models.push({ name: match[1], path: relativePath });
    }

    // Reset regex indices
    Object.values(REGEX_PATTERNS).forEach(re => re.lastIndex = 0);
}

console.log(`\x1b[36m[SemanticIndexer] Starting deep scan of: ${PROJECT_ROOT}...\x1b[0m`);
scanDirectory(PROJECT_ROOT);

const outputPath = path.join(__dirname, '..', 'data', 'semantic_index.json');
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

console.log(`\x1b[32m[SemanticIndexer] Scan complete!\x1b[0m`);
console.log(`- Files scanned: ${index.metadata.files_scanned}`);
console.log(`- Classes found: ${index.classes.length}`);
console.log(`- Functions found: ${index.functions.length}`);
console.log(`- Models found: ${index.models.length}`);
console.log(`\x1b[35m[Saved]: ${outputPath}\x1b[0m`);
