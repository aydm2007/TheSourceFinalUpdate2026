import fs from 'fs';
import path from 'path';

/**
 * Sovereign Vector Adapter V1.0
 * Handles local indexing of memory chunks for semantic search.
 * This replaces the legacy Python-based vectorize_memory.py.
 */

export interface MemoryChunk {
    id: string;
    date: string;
    title: string;
    content: string;
    metadata: {
        source: string;
        type: string;
    };
}

export class VectorMemoryAdapter {
    private memoryDir: string;
    private outputPath: string;

    constructor(workspaceRoot: string) {
        this.memoryDir = path.join(workspaceRoot, '.agents', 'memory');
        this.outputPath = path.join(this.memoryDir, 'vector_index.json');
    }

    /**
     * Parses markdown files and creates a structured JSON index.
     * In a full implementation, this would also generate embeddings using a local model.
     */
    public async vectorize(): Promise<void> {
        console.log(`[Alpha] Scanning memory directory: ${this.memoryDir}`);
        
        if (!fs.existsSync(this.memoryDir)) {
            console.error(`[Alpha] Memory directory not found: ${this.memoryDir}`);
            return;
        }

        const files = fs.readdirSync(this.memoryDir).filter(f => f.endswith('.md'));
        const vectorData: MemoryChunk[] = [];

        for (const file of files) {
            const content = fs.readFileSync(path.join(this.memoryDir, file), 'utf-8');
            const chunks = this.parseMarkdown(content);
            vectorData.push(...chunks);
        }

        console.log(`[Alpha] Saving ${vectorData.length} chunks to ${this.outputPath}`);
        fs.writeFileSync(this.outputPath, JSON.stringify(vectorData, null, 2), 'utf-8');
        
        console.log("[Alpha] Vectorization preparation complete (TS Native).");
    }

    private parseMarkdown(content: string): MemoryChunk[] {
        const chunks: MemoryChunk[] = [];
        const sections = content.split(/##\s+/);

        for (const section of sections) {
            if (!section.trim()) continue;

            const lines = section.trim().split('\n');
            const header = lines[0] || 'unknown';
            const body = lines.slice(1).join('\n');

            const dateMatch = header.match(/(\d{4}-\d{2}-\d{2})/);
            const date = dateMatch ? dateMatch[1] : 'unknown';

            chunks.push({
                id: `chunk_${Date.now()}_${chunks.length}`,
                date: date || 'unknown',
                title: header,
                content: body,
                metadata: {
                    source: 'memory',
                    type: header.toLowerCase().includes('decision') ? 'decision_log' : 'pattern'
                }
            });
        }
        return chunks;
    }
}
