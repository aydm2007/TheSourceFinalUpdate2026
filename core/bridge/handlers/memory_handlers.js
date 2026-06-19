const fs = require('fs');
const path = require('path');

// --- TF-IDF & Cosine Similarity Engine (Pure JS / 0 Dependencies) ---
function getTokens(text) {
    if (!text || typeof text !== 'string') return [];
    return text.toLowerCase().replace(/[^a-z0-9_]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

function calculateTF(tokens) {
    const tf = {};
    for (const t of tokens) {
        tf[t] = (tf[t] || 0) + 1;
    }
    const max = Math.max(...Object.values(tf), 1);
    for (const k in tf) {
        tf[k] = tf[k] / max;
    }
    return tf;
}

function buildVector(tf, idf, allTerms) {
    return allTerms.map(t => (tf[t] || 0) * (idf[t] || 0));
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] ** 2;
        normB += vecB[i] ** 2;
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function LedgerCompactor(args, context) {
    const ledgerPath = path.resolve(context.__dirname || process.cwd(), '.nexus/var/telemetry/shadow_ledger.jsonl');
    const compactPath = path.resolve(context.__dirname || process.cwd(), '.nexus/var/telemetry/shadow_ledger_compact.jsonl');
    
    if (!fs.existsSync(ledgerPath)) return `[LedgerCompactor] No ledger found at ${ledgerPath}`;
    
    const content = fs.readFileSync(ledgerPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const compactLines = [];
    
    for (const line of lines) {
        if (line.includes('MAP_ANCHOR') || line.includes('DECISION') || line.includes('ERROR') || line.includes('CRITICAL')) {
            compactLines.push(line);
        }
    }
    
    fs.writeFileSync(compactPath, compactLines.join('\n') + '\n', 'utf8');
    
    const originalSize = (Buffer.byteLength(content, 'utf8') / 1024 / 1024).toFixed(2);
    const compactSize = (Buffer.byteLength(compactLines.join('\n'), 'utf8') / 1024).toFixed(2);
    
    return `[LedgerCompactor] Shadow Ledger compacted successfully!\n` +
           `Original: ${originalSize} MB -> Compact: ${compactSize} KB\n` +
           `Kept ${compactLines.length} out of ${lines.length} semantic entries.`;
}

async function VectorSearch(args, context) {
    const compactPath = path.resolve(context.__dirname || process.cwd(), '.nexus/var/telemetry/shadow_ledger_compact.jsonl');
    
    if (!fs.existsSync(compactPath)) {
        await LedgerCompactor({}, context); // Auto-compact if not exists
    }
    
    const content = fs.readFileSync(compactPath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const documents = [];
    
    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
            const text = JSON.stringify(parsed);
            documents.push({ text, raw: parsed });
        } catch (e) {
            documents.push({ text: line, raw: line });
        }
    }
    
    if (documents.length === 0) return `[VectorSearch] The compact ledger is empty.`;
    
    // Build TF-IDF
    const allTokens = documents.map(doc => getTokens(doc.text));
    const df = {};
    const N = documents.length;
    
    allTokens.forEach(tokens => {
        const unique = new Set(tokens);
        unique.forEach(t => {
            df[t] = (df[t] || 0) + 1;
        });
    });
    
    const idf = {};
    for (const k in df) {
        idf[k] = Math.log(N / (1 + df[k]));
    }
    
    const allTerms = Object.keys(idf);
    const docVectors = allTokens.map(tokens => buildVector(calculateTF(tokens), idf, allTerms));
    
    const queryTokens = getTokens(args.query);
    const queryVector = buildVector(calculateTF(queryTokens), idf, allTerms);
    
    const results = [];
    for (let i = 0; i < docVectors.length; i++) {
        const score = cosineSimilarity(queryVector, docVectors[i]);
        if (score > 0.05) { // Minimum threshold
            results.push({ score, doc: documents[i].raw });
        }
    }
    
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, 3);
    
    if (topResults.length === 0) {
        return `[Quantum Vector Search] 0 matches found for query: "${args.query}"`;
    }
    
    return `[Quantum Vector Search] Found ${topResults.length} relevant historical memory nodes in 0-Token RAG:\n\n` +
           topResults.map((r, idx) => `[Rank ${idx + 1}] (Similarity: ${(r.score * 100).toFixed(1)}%)\n${JSON.stringify(r.doc, null, 2)}`).join('\n\n');
}

module.exports = {
    LedgerCompactor,
    VectorSearch
};
