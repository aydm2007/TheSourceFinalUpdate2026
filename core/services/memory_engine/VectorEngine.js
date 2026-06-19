const fs = require('fs');
const path = require('path');

class VectorEngine {
    constructor(workspaceRoot) {
        this.memoryDir = path.join(workspaceRoot, '.agents', 'memory');
        this.dbPath = path.join(this.memoryDir, 'vectoredge.json');
        this.records = [];
        this.initialize();
    }

    initialize() {
        if (!fs.existsSync(this.memoryDir)) {
            fs.mkdirSync(this.memoryDir, { recursive: true });
        }
        if (fs.existsSync(this.dbPath)) {
            try {
                this.records = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
            } catch (e) {
                console.error(`[VectorEngine] Error parsing db: ${e.message}`);
                this.records = [];
            }
        } else {
            this.records = [];
            this.save();
        }

        // Merge records from vector_index.json (consolidated semantic and graph memory)
        const indexFilePath = path.join(this.memoryDir, 'vector_index.json');
        if (fs.existsSync(indexFilePath)) {
            try {
                const indexRecords = JSON.parse(fs.readFileSync(indexFilePath, 'utf8'));
                if (Array.isArray(indexRecords)) {
                    const mappedIndexRecords = indexRecords.map(r => ({
                        id: r.id || `idx_${Math.random()}`,
                        text: `${r.title || ''} ${r.content || ''}`,
                        timestamp: r.timestamp ? new Date(r.timestamp).getTime() : Date.now()
                    }));
                    const existingIds = new Set(this.records.map(rec => rec.id));
                    for (const mRec of mappedIndexRecords) {
                        if (!existingIds.has(mRec.id)) {
                            this.records.push(mRec);
                            existingIds.add(mRec.id);
                        }
                    }
                }
            } catch (e) {
                console.error(`[VectorEngine] Error parsing index file: ${e.message}`);
            }
        }
    }

    save() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.records, null, 2), 'utf8');
    }

    /**
     * Compute Cosine Similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * TF-IDF scoring: Term Frequency × Inverse Document Frequency
     * Produces accurate relevance rankings across the full corpus.
     */
    keywordScore(text, query) {
        const textLower = (text || '').toLowerCase();
        const textTokens = textLower.split(/\s+/);
        const docLen = textTokens.length || 1;
        const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
        if (keywords.length === 0) return 0;

        const totalDocs = this.records.length || 1;
        let score = 0;

        for (const kw of keywords) {
            // TF: count of keyword in this document / document length
            let termCount = 0;
            for (const tok of textTokens) {
                if (tok.includes(kw)) termCount++;
            }
            const tf = termCount / docLen;

            // IDF: log(total docs / docs containing this keyword)
            let docsWithTerm = 0;
            for (const rec of this.records) {
                if ((rec.text || '').toLowerCase().includes(kw)) docsWithTerm++;
            }
            const idf = Math.log((totalDocs + 1) / (docsWithTerm + 1)) + 1;

            score += tf * idf;
        }

        return score;
    }

    sync(recordsArray) {
        let added = 0;
        let updated = 0;
        for (const record of recordsArray) {
            const existingIdx = this.records.findIndex(r => r.id === record.id);
            if (existingIdx >= 0) {
                this.records[existingIdx] = { ...this.records[existingIdx], ...record, timestamp: Date.now() };
                updated++;
            } else {
                this.records.push({ ...record, timestamp: Date.now() });
                added++;
            }
        }
        this.save();
        return { added, updated, total: this.records.length };
    }

    search(query, embedding, limit = 5) {
        // Pre-compute IDFs if it is a keyword search to avoid O(N^2) complexity
        const idfs = {};
        let keywords = [];
        if (query && (!embedding || embedding.length === 0)) {
            keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
            const totalDocs = this.records.length || 1;
            for (const kw of keywords) {
                let docsWithTerm = 0;
                for (const rec of this.records) {
                    if ((rec.text || '').toLowerCase().includes(kw)) docsWithTerm++;
                }
                idfs[kw] = Math.log((totalDocs + 1) / (docsWithTerm + 1)) + 1;
            }
        }

        const results = this.records.map(record => {
            let score = 0;
            if (embedding && record.embedding && embedding.length > 0) {
                score = this.cosineSimilarity(embedding, record.embedding);
            } else if (query && keywords.length > 0) {
                const textLower = (record.text || '').toLowerCase();
                const textTokens = textLower.split(/\s+/);
                const docLen = textTokens.length || 1;
                for (const kw of keywords) {
                    let termCount = 0;
                    for (const tok of textTokens) {
                        if (tok.includes(kw)) termCount++;
                    }
                    const tf = termCount / docLen;
                    const idf = idfs[kw] || 1;
                    score += tf * idf;
                }
            }
            return { ...record, score };
        });

        // Filter non-zero scores and sort descending
        const filtered = results.filter(r => r.score > 0).sort((a, b) => b.score - a.score);
        return filtered.slice(0, limit).map(r => {
            const { embedding, ...rest } = r; // Do not return raw vectors
            return rest;
        });
    }
    /**
     * Quantum-Graph Feature: Auto-extract dependencies from a given file
     */
    extractDependencies(filePath) {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) return [];
        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Regex to match `require('...')` or `import ... from '...'`
            const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
            const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
            const dependencies = new Set();
            let match;
            
            while ((match = requireRegex.exec(content)) !== null) {
                dependencies.add(match[1]);
            }
            while ((match = importRegex.exec(content)) !== null) {
                dependencies.add(match[1]);
            }
            
            return Array.from(dependencies);
        } catch (e) {
            console.error(`[VectorEngine] Error extracting dependencies: ${e.message}`);
            return [];
        }
    }
}

module.exports = VectorEngine;
