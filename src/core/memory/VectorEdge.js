"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorEdge = void 0;
const sqlite3 = require("sqlite3");
const { promisify } = require("util");
const path = require("path");
const fs = require("fs");

class VectorEdge {
  db;
  dbPath;
  constructor(dbPath = ".agents/memory/vectoredge.db") {
    this.dbPath = path.resolve(process.cwd(), dbPath);
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.db = new sqlite3.Database(this.dbPath);
  }
  async initialize() {
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
  async insert(record) {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      `INSERT OR REPLACE INTO embeddings (id, text, embedding, metadata) VALUES (?, ?, ?, ?)`,
      [
        record.id,
        record.text || "",
        JSON.stringify(record.embedding || []),
        JSON.stringify(record.metadata || {}),
      ],
    );
  }
  async insertMany(records) {
    const run = promisify(this.db.run.bind(this.db));
    await run("BEGIN TRANSACTION");
    try {
      const stmt = this.db.prepare(
        `INSERT OR REPLACE INTO embeddings (id, text, embedding, metadata) VALUES (?, ?, ?, ?)`,
      );
      const stmtRun = promisify(stmt.run.bind(stmt));
      for (const r of records) {
        await stmtRun([
          r.id,
          r.text || "",
          JSON.stringify(r.embedding || []),
          JSON.stringify(r.metadata || {}),
        ]);
      }
      stmt.finalize();
      await run("COMMIT");
    } catch (e) {
      await run("ROLLBACK");
      throw e;
    }
  }
  cosineSimilarity(vecA, vecB) {
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
  async search(queryEmbedding, limit = 5) {
    const all = promisify(this.db.all.bind(this.db));
    const rows = await all(
      `SELECT id, text, embedding, metadata FROM embeddings`,
    );
    const results = rows.map((row) => {
      const embedding = JSON.parse(row.embedding);
      return {
        id: row.id,
        text: row.text,
        embedding,
        metadata: JSON.parse(row.metadata),
        score: this.cosineSimilarity(queryEmbedding, embedding),
      };
    });
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
  async close() {
    const close = promisify(this.db.close.bind(this.db));
    await close();
  }
}
exports.VectorEdge = VectorEdge;
