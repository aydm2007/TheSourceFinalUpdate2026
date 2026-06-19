import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VectorEdge } from '../memory/VectorEdge.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Sovereign Core - VectorEdge Database', () => {
  let db: VectorEdge;
  const dbPath = '.agents/memory/test-vectoredge.db';

  beforeAll(async () => {
    db = new VectorEdge(dbPath);
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
    try {
        fs.unlinkSync(path.resolve(process.cwd(), dbPath));
    } catch(e) {}
  });

  it('should insert and search vectors based on cosine similarity', async () => {
    const records = [
      { id: '1', text: 'cat', embedding: [1, 0, 0], metadata: { type: 'animal' } },
      { id: '2', text: 'dog', embedding: [0.9, 0.1, 0], metadata: { type: 'animal' } },
      { id: '3', text: 'car', embedding: [0, 1, 0], metadata: { type: 'vehicle' } },
    ];

    await db.insertMany(records);

    // Query for something like a cat
    const results = await db.search([0.9, 0, 0], 2);
    
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('1'); // cat is closest
    expect(results[1].id).toBe('2'); // dog is second
    expect(results[0].score).toBeGreaterThan(0.9);
  });
});
