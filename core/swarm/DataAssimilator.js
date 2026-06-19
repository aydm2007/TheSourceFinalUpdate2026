const fs = require('fs');
const path = require('path');
const glob = require('glob');
const VectorEngine = require('../services/memory_engine/VectorEngine.js');

class DataAssimilator {
  constructor() {
    this.maxTokens = 1000000; // Gemini Flash 3.5 1M context
    this.workspaceRoot = path.join(__dirname, '..', '..');
  }

  /**
   * Assimilates the entire workspace structure and code into a single context string
   * utilizing Gemini Flash 3.5's massive context window.
   */
  async assimilateWorkspace(includes = ['**/*.js', '**/*.ts', '**/*.md'], excludes = ['node_modules/**', '.git/**', 'dist/**', 'build/**']) {
    let assimilatedContext = '=== SOVEREIGN WORKSPACE ASSIMILATION (GEMINI FLASH 3.5 1M CONTEXT) ===\n\n';
    let totalBytes = 0;

    for (const pattern of includes) {
      const files = glob.sync(pattern, { cwd: this.workspaceRoot, ignore: excludes, absolute: true });
      for (const file of files) {
        try {
          const stats = fs.statSync(file);
          if (stats.size > 250000) continue; // Skip huge individual files > 250KB

          const content = fs.readFileSync(file, 'utf8');
          const relPath = path.relative(this.workspaceRoot, file);
          
          assimilatedContext += `\n--- FILE: ${relPath} ---\n`;
          assimilatedContext += content;
          assimilatedContext += `\n--- END FILE: ${relPath} ---\n`;
          
          totalBytes += stats.size;
          
          // Rough token estimation (1 token ≈ 4 bytes)
          if ((totalBytes / 4) > (this.maxTokens * 0.9)) {
            assimilatedContext += '\n[ASSIMILATION TRUNCATED TO PROTECT CONTEXT WINDOW]';
            break;
          }
        } catch (e) {
          // Ignore read errors
        }
      }
      if ((totalBytes / 4) > (this.maxTokens * 0.9)) break;
    }

    assimilatedContext += `\n\n=== ASSIMILATION COMPLETE. TOTAL ESTIMATED BYTES: ${totalBytes} ===`;
    return {
      success: true,
      context_length: assimilatedContext.length,
      estimated_tokens: Math.round(totalBytes / 4),
      context: assimilatedContext
    };
  }

  /**
   * Consumes unstructured chaotic texts and converts them into semantic vectors.
   * @param {string} textContent The raw chaotic text
   * @param {string} tenant The tenant namespace (e.g., 'local' or 'Tenant01')
   */
  async assimilateUnstructuredData(textContent, tenant = 'local') {
    if (!textContent || textContent.length < 10) {
        return `[Data-Assimilator] Rejected: Text too short or empty.`;
    }

    const tenantPath = tenant === 'local' 
        ? this.workspaceRoot 
        : path.join(this.workspaceRoot, 'projects', tenant);
        
    const vectorDbPath = path.join(tenantPath, '.agents', 'memory', 'vectoredge.json');
    
    // Initialize memory engine
    const engine = new VectorEngine({ path: vectorDbPath });
    engine.loadIndex();

    // Break text into digestible cognitive chunks
    const chunks = textContent.split(/(?:\r?\n){2,}/).filter(c => c.trim().length > 0);
    let ingested = 0;

    for (const chunk of chunks) {
        const documentId = `assimilation_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        engine.addDocument(documentId, chunk, {
            source: 'DataAssimilator',
            timestamp: new Date().toISOString(),
            type: 'UNSTRUCTURED_KNOWLEDGE'
        });
        ingested++;
    }

    engine.saveIndex();

    return `[Data-Assimilator] Successfully consumed and vectorized ${ingested} cognitive chunks into tenant '${tenant}' memory bank.`;
  }
}

module.exports = { DataAssimilator };
