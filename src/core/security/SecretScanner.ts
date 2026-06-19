import * as fs from 'fs';
import * as path from 'path';

/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔒 SecretScanner — Sovereign Security Monitor                 │
 * │  Scans the workspace for exposed secrets on every boot         │
 * └────────────────────────────────────────────────────────────────┘
 */
export class SecretScanner {
  private workspaceRoot: string;
  // A heuristic list of regexes to catch common hardcoded API keys/passwords
  private secretPatterns = [
    /sk-[a-zA-Z0-9]{32,}/g,             // General sk- prefix keys
    /AIza[0-9A-Za-z-_]{35}/g,           // Google API keys
    /gh[pousr]_[A-Za-z0-9_]{36,}/g,     // GitHub tokens
    /(password|secret|api_key)\s*=\s*['"][^'"]+['"]/gi // General assignments
  ];

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Scans a specific file for secrets.
   */
  public scanFile(filePath: string): { file: string, matches: string[] } | null {
    try {
      const fullPath = path.resolve(this.workspaceRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches: string[] = [];

      for (const pattern of this.secretPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            // Obfuscate the matched secret for logging purposes to avoid leaking
            const obfuscated = match[0].substring(0, 5) + '***' + match[0].substring(match[0].length - 3);
            matches.push(obfuscated);
        }
      }

      if (matches.length > 0) {
        return { file: filePath, matches };
      }
      return null;
    } catch (e) {
      console.warn(`[SecretScanner] Could not read file ${filePath} for scanning.`);
      return null;
    }
  }

  /**
   * Fast scan over commonly exposed files like .env or config files.
   * Note: In a full implementation, this should recursively scan the src directory.
   */
  public quickScan(): void {
     const criticalFiles = ['.env', 'src/config.ts', 'src/utils/config.ts', 'src/utils/auth.ts'];
     const violations: any[] = [];

     for (const file of criticalFiles) {
        const result = this.scanFile(file);
        if (result) violations.push(result);
     }

     if (violations.length > 0) {
         console.warn(`🚨 [SecretScanner] WARNING: Potential secrets detected in workspace!`);
         console.warn(JSON.stringify(violations, null, 2));
         // In strict mode, we might throw an error here to prevent boot
     } else {
         console.log(`✅ [SecretScanner] Quick scan completed. No exposed secrets detected in critical files.`);
     }
  }
}
