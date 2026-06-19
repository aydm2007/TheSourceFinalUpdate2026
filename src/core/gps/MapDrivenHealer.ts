import * as fs from 'fs';
import * as path from 'path';
import { SourceMapConsumer, RawSourceMap } from 'source-map';

export interface HealResult {
  success: boolean;
  originalFile?: string;
  line?: number;
  column?: number;
  message?: string;
}

/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🗺️ MapDrivenHealer — Sovereign GPS Recovery Engine            │
 * │  Reverse-maps stack traces using cli.js.map to target healing  │
 * └────────────────────────────────────────────────────────────────┘
 */
export class MapDrivenHealer {
  private mapPath: string;
  private rawMap: RawSourceMap | null = null;

  constructor(workspaceRoot: string) {
    // Assuming the map file is located in the package directory
    this.mapPath = path.join(workspaceRoot, 'package', 'cli.js.map');
  }

  /**
   * Initializes the SourceMapConsumer by loading the map file.
   */
  async init(): Promise<void> {
    if (!fs.existsSync(this.mapPath)) {
      console.warn(`[MapDrivenHealer] cli.js.map not found at ${this.mapPath}. Reverse mapping disabled.`);
      return;
    }
    
    try {
      const mapContent = fs.readFileSync(this.mapPath, 'utf8');
      this.rawMap = JSON.parse(mapContent);
    } catch (e) {
      console.error(`[MapDrivenHealer] Failed to parse source map: ${e}`);
    }
  }

  /**
   * Parses an error stack trace, finds the first relevant location,
   * maps it back to the original source, and proposes an AST patch target.
   */
  async healFromError(stackTrace: string): Promise<HealResult> {
    if (!this.rawMap) {
      return { success: false, message: 'Source map not loaded.' };
    }

    // Heuristically find the first file/line/col in the stack trace
    // Matches something like: "at SomeClass.method (/path/to/cli.js:123:45)"
    const traceRegex = /at\s+.*\s+\((.*):(\d+):(\d+)\)/;
    const match = traceRegex.exec(stackTrace);

    if (!match) {
      return { success: false, message: 'Could not extract location from stack trace.' };
    }

    const [, _bundlePath, lineStr, colStr] = match;
    const line = parseInt(lineStr, 10);
    const column = parseInt(colStr, 10);

    return new Promise((resolve) => {
      SourceMapConsumer.with(this.rawMap!, null, (consumer) => {
        const originalPosition = consumer.originalPositionFor({
          line,
          column
        });

        if (!originalPosition.source) {
          resolve({ success: false, message: 'Source map resolution failed for given location.' });
          return;
        }

        // Successfully mapped back to the original TypeScript source file
        resolve({
          success: true,
          originalFile: originalPosition.source,
          line: originalPosition.line ?? undefined,
          column: originalPosition.column ?? undefined,
          message: `Target identified: ${originalPosition.source}:${originalPosition.line}`
        });
      }).catch(err => {
        resolve({ success: false, message: `Consumer error: ${err.message}` });
      });
    });
  }
}

export default MapDrivenHealer;
