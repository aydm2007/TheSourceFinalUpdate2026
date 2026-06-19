import { z } from 'zod/v4'
import * as fs from 'fs/promises'
import * as path from 'path'
import { buildTool } from '../../Tool.js'
import { getCwd } from '../../utils/cwd.js'
import { expandPath } from '../../utils/path.js'

const inputSchema = z.strictObject({
  scan_path: z.string().optional().describe('The root directory to scan and index (defaults to cwd)'),
  output_index_path: z.string().optional().describe('Where to save the JSON index (default: scratch/ast_index.json)'),
})

type InputSchema = typeof inputSchema

export const AstIndexerTool = buildTool({
  name: 'AstIndexer',
  searchHint: 'pre-compile an AST index of classes and functions for massive repositories',
  maxResultSizeChars: 50000,
  strict: true,
  async description() {
    return 'Recursively scans a project directory to build a lightweight JSON graph of classes and functions, allowing instant structural retrieval in massive codebases without token-heavy full file reads.'
  },
  async prompt() {
    return 'Use AstIndexer to create a searchable structural map of the workspace. Crucial when dealing with legacy or massive codebases.'
  },
  get inputSchema(): InputSchema {
    return inputSchema
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input) {
    return input.scan_path || 'cwd'
  },
  userFacingName() {
    return 'AstIndexer'
  },
  async call({ scan_path, output_index_path }, context) {
    const rootPath = expandPath(scan_path || getCwd());
    const indexPath = expandPath(output_index_path || path.join(getCwd(), 'scratch', 'ast_index.json'));
    
    const index: Record<string, { classes: string[], functions: string[] }> = {};
    let scannedFiles = 0;

    async function walk(dir: string) {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch (e) { return; }

      for (const entry of entries) {
        const fp = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', 'coverage', '.agents'].includes(entry.name)) {
            await walk(fp);
          }
        } else {
          const ext = path.extname(entry.name);
          if (['.ts', '.tsx', '.js', '.jsx', '.py', '.dart', '.go'].includes(ext)) {
            scannedFiles++;
            try {
              const content = await fs.readFile(fp, 'utf8');
              const lines = content.split('\n');
              const classes: string[] = [];
              const functions: string[] = [];

              for (const line of lines) {
                const classMatch = line.match(/^\s*(export\s+)?(class\s+\w+)/);
                if (classMatch) classes.push(classMatch[2]);
                
                const funcMatch = line.match(/^\s*(export\s+)?(async\s+)?(function\s+\w+|\w+\s*\([^)]*\)\s*\{|\w+\s*=\s*\([^)]*\)\s*=>)/);
                if (funcMatch) functions.push(funcMatch[3].trim().replace(/\s*\{$/, ''));
                
                const pyMatch = line.match(/^\s*(def\s+\w+)/);
                if (pyMatch) functions.push(pyMatch[1].trim());
              }

              if (classes.length > 0 || functions.length > 0) {
                index[path.relative(rootPath, fp)] = { classes, functions };
              }
            } catch (e) {
              // ignore unreadable files
            }
          }
        }
      }
    }

    try {
      await walk(rootPath);
      await fs.mkdir(path.dirname(indexPath), { recursive: true });
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');

      return {
        data: {
          success: true,
          scannedFiles,
          indexedEntities: Object.keys(index).length,
          indexPath,
        }
      }
    } catch (err: any) {
      throw new Error(`AstIndexer failed: ${err.message}`);
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `### AST Indexing Complete\n\n- **Files Scanned**: ${data.scannedFiles}\n- **Files with Entities**: ${data.indexedEntities}\n- **Index Saved To**: \`${data.indexPath}\``,
    }
  },
  renderToolUseMessage(input) {
    return `Building AST Index for: ${input.scan_path || 'cwd'}`
  }
})
