import { z } from 'zod/v4'
import * as fs from 'fs/promises'
import { buildTool } from '../../Tool.js'
import { expandPath } from '../../utils/path.js'

const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file to compress'),
  compression_level: z.enum(['low', 'medium', 'high']).optional().describe('Compression level (default: medium)'),
})

type InputSchema = typeof inputSchema

export const SemanticContextCompressorTool = buildTool({
  name: 'SemanticContextCompressor',
  searchHint: 'compress massive files to their structural skeleton to save token space',
  maxResultSizeChars: 150000,
  strict: true,
  async description() {
    return 'Compresses massive code files by stripping out implementations, comments, and empty lines, leaving only the structural skeleton (signatures, classes). Essential for massive legacy files.'
  },
  async prompt() {
    return 'Use SemanticContextCompressor when a file is too large to fit in context window. It returns the compressed semantic skeleton.'
  },
  get inputSchema(): InputSchema {
    return inputSchema
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input) {
    return input.file_path
  },
  getPath({ file_path }): string {
    return file_path
  },
  userFacingName() {
    return 'SemanticContextCompressor'
  },
  async call({ file_path, compression_level = 'medium' }, context) {
    const fullPath = expandPath(file_path);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');
      
      const compressed = [];
      let inDocstring = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Basic comment stripping for High compression
        if (compression_level === 'high') {
          if (trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
          if (trimmed.startsWith('/*')) { inDocstring = true; continue; }
          if (inDocstring && trimmed.endsWith('*/')) { inDocstring = false; continue; }
          if (inDocstring) continue;
        }

        // Keep structural lines
        if (
          trimmed.startsWith('export ') || 
          trimmed.startsWith('class ') || 
          trimmed.startsWith('function ') || 
          trimmed.startsWith('def ') || 
          trimmed.startsWith('import ') || 
          trimmed.includes('=>') || 
          trimmed.endsWith('{') || 
          trimmed.endsWith('}')
        ) {
          compressed.push(line);
        } else if (compression_level === 'low') {
          compressed.push(line); // low keeps almost everything except pure empty lines
        }
      }

      const originalSize = content.length;
      const compressedOutput = compressed.join('\n');
      const compressedSize = compressedOutput.length;
      const ratio = ((1 - (compressedSize / originalSize)) * 100).toFixed(2);

      return {
        data: {
          success: true,
          ratio,
          compressedContent: compressedOutput,
        }
      }
    } catch (err: any) {
      throw new Error(`SemanticContextCompressor failed on ${file_path}: ${err.message}`);
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `### Context Compressed (Saved ${data.ratio}% tokens)\n\n\`\`\`text\n${data.compressedContent}\n\`\`\``,
    }
  },
  renderToolUseMessage(input) {
    return `Compressing context for: ${input.file_path}`
  }
})
