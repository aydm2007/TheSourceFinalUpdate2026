import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VectorEdge } from '../VectorEdge';
import fs from 'fs';

describe('VectorEdge (V40.0-Singularity)', () => {
    const dbPath = '.agents/memory/test_vectoredge.db';
    let vectorDB: VectorEdge;

    beforeAll(async () => {
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
        vectorDB = new VectorEdge(dbPath);
        await vectorDB.initialize();
    });

    afterAll(async () => {
        await vectorDB.close();
        if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    });

    it('should insert records and find nearest neighbor using pure cosine similarity', async () => {
        const dummyRecords = [
            { id: "doc1", text: "React component for button", embedding: [0.1, 0.2, 0.3], metadata: { type: "UI" } },
            { id: "doc2", text: "Database schema for users", embedding: [0.8, 0.9, 0.1], metadata: { type: "DB" } },
            { id: "doc3", text: "React hook for state", embedding: [0.15, 0.25, 0.35], metadata: { type: "UI" } }
        ];

        await vectorDB.insertMany(dummyRecords);

        // A query vector closer to doc1 and doc3 (UI)
        const query = [0.12, 0.22, 0.32];
        const results = await vectorDB.search(query, 2);

        expect(results.length).toBe(2);
        
        // The most similar should be doc1 because it's closest to query
        expect(results[0].id).toBe('doc1');
        expect(results[1].id).toBe('doc3');
        
        // Ensure metadata is intact
        expect(results[0].metadata.type).toBe('UI');
    });
});
