import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export interface VectorRecord {
    id: string;
    text: string;
    embedding: number[];
    metadata: Record<string, any>;
}

export class VectorEdge {
    private db: sqlite3.Database;
    private dbPath: string;

    constructor(dbPath: string = '.agents/memory/vectoredge.db') {
        this.dbPath = path.resolve(process.cwd(), dbPath);
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.db = new sqlite3.Database(this.dbPath);
    }

    public async initialize(): Promise<void> {
        const run = promisify(this.db.run.bind(this.db));
        await run(`
            CREATE TABLE IF NOT EXISTS embeddings (
                id TEXT PRIMARY KEY,
                text TEXT NOT NULL,
                embedding TEXT NOT NULL,
                metadata TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    public async insert(record: VectorRecord): Promise<void> {
        const run = promisify(this.db.run.bind(this.db));
        await run(
            `INSERT OR REPLACE INTO embeddings (id, text, embedding, metadata) VALUES (?, ?, ?, ?)`,
            [record.id, record.text || '', JSON.stringify(record.embedding || []), JSON.stringify(record.metadata || {})]
        );
    }

    public async insertMany(records: VectorRecord[]): Promise<void> {
        const run = promisify(this.db.run.bind(this.db));
        await run('BEGIN TRANSACTION');
        try {
            const stmt = this.db.prepare(`INSERT OR REPLACE INTO embeddings (id, text, embedding, metadata) VALUES (?, ?, ?, ?)`);
            const stmtRun = promisify(stmt.run.bind(stmt));
            for (const r of records) {
                await stmtRun([r.id, r.text || '', JSON.stringify(r.embedding || []), JSON.stringify(r.metadata || {})]);
            }
            stmt.finalize();
            await run('COMMIT');
        } catch (e) {
            await run('ROLLBACK');
            throw e;
        }
    }

    // Pure TS Cosine Similarity for OS-Agnostic Edge Vector Search
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
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

    public async search(queryEmbedding: number[], limit: number = 5): Promise<Array<VectorRecord & { score: number }>> {
        const all = promisify(this.db.all.bind(this.db));
        const rows = await all(`SELECT id, text, embedding, metadata FROM embeddings`) as any[];

        const results = rows.map(row => {
            const embedding = JSON.parse(row.embedding) as number[];
            return {
                id: row.id,
                text: row.text,
                embedding,
                metadata: JSON.parse(row.metadata),
                score: this.cosineSimilarity(queryEmbedding, embedding)
            };
        });

        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }

    public async close(): Promise<void> {
        const close = promisify(this.db.close.bind(this.db));
        await close();
    }
}
