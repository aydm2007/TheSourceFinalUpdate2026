import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface LedgerEntry {
  timestamp: string;
  tool: string;
  args: any;
  durationMs: number;
  status: 'success' | 'error';
  previous_hash: string;
  hash: string;
  hmac: string;
}

class ShadowLedger {
  private ledgerPathOverride: string | null = null;
  private writeQueue: Promise<any> = Promise.resolve();

  private getLedgerPath(): string {
    if (this.ledgerPathOverride) {
      return this.ledgerPathOverride;
    }
    if (process.env.SHADOW_LEDGER_PATH) {
      return process.env.SHADOW_LEDGER_PATH;
    }
    const scope = process.env.AETHER_TELEMETRY_SCOPE || 'project';
    if (scope === 'user') {
      const home = process.env.NEXUS_CONFIG_DIR || path.join(require('os').homedir(), '.nexus');
      return path.join(process.env.NEXUS_ENGINE_REMOTE_MEMORY_DIR || home, 'var', 'telemetry', 'shadow_ledger.jsonl');
    }
    const projectLedgerPath = path.join(process.cwd(), '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');
    if (fs.existsSync(projectLedgerPath)) {
      return projectLedgerPath;
    }
    return path.join('.agents', 'memory', 'shadow_ledger.jsonl');
  }

  private getLockPath(): string {
    const ledger = this.getLedgerPath();
    return path.join(path.dirname(ledger), path.basename(ledger, '.jsonl') + '.lock');
  }

  private async acquireLock(): Promise<any> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const start = Date.now();
    const timeout = 10000; // 10 seconds max wait
    const lockPath = this.getLockPath();
    while (Date.now() - start < timeout) {
      try {
        const handle = await fs.promises.open(lockPath, 'wx');
        return handle;
      } catch (err: any) {
        if (err.code === 'EEXIST') {
          // Stale lock detection (force unlink if lock exists for > 5 seconds)
          try {
            const stats = await fs.promises.stat(lockPath);
            const ageMs = Date.now() - stats.mtimeMs;
            if (ageMs > 5000) {
              await fs.promises.unlink(lockPath);
            }
          } catch {}
          await delay(10 + Math.random() * 20);
          continue;
        }
        throw err;
      }
    }
    throw new Error('ShadowLedger: Timeout acquiring ledger lock');
  }

  private async releaseLock(handle: any) {
    try {
      await handle.close();
    } catch {}
    try {
      await fs.promises.unlink(this.getLockPath());
    } catch {}
  }

  private calculateHash(entry: Omit<LedgerEntry, 'hash' | 'hmac'>): string {
    const data = `${entry.timestamp}:${entry.tool}:${JSON.stringify(entry.args)}:${entry.durationMs}:${entry.status}:${entry.previous_hash}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private calculateHmac(hash: string): string {
    const secret = process.env.SHADOW_LEDGER_KEY || 'default-insecure-key';
    return crypto.createHmac('sha256', secret).update(hash).digest('hex');
  }

  async getTailHash(): Promise<string> {
    const entries = await this.readAllEntries(1); // Only need the last entry
    if (entries.length === 0) {
      return '0'.repeat(64);
    }
    const last = entries[entries.length - 1];
    return last.hash || '0'.repeat(64);
  }

  async readAllEntries(limit: number = 1000): Promise<any[]> {
    const ledger = this.getLedgerPath();
    if (!fs.existsSync(ledger)) {
      return [];
    }
    const content = await fs.promises.readFile(ledger, 'utf8');
    const lines = content.trim().split('\n');
    const entries: any[] = [];
    
    // Protect memory by reading only the last N lines unless limit is -1
    const maxLines = limit === -1 ? lines.length : Math.min(lines.length, limit);
    const startIdx = lines.length - maxLines;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      try {
        entries.push(JSON.parse(line));
      } catch {
        // Skip malformed lines
      }
    }
    return entries;
  }

  async logEvent(tool: string, args: any, durationMs: number, status: 'success' | 'error' = 'success'): Promise<LedgerEntry> {
    return new Promise((resolve, reject) => {
      this.writeQueue = this.writeQueue.then(async () => {
        let lockHandle;
        try {
          // Acquire cross-process lock
          lockHandle = await this.acquireLock();

          const ledger = this.getLedgerPath();
          const parentDir = path.dirname(ledger);
          if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
          }

          const previous_hash = await this.getTailHash();
          const entryWithoutHash = {
            timestamp: new Date().toISOString(),
            tool,
            args,
            durationMs,
            status,
            previous_hash,
          };

          const hash = this.calculateHash(entryWithoutHash);
          const hmac = this.calculateHmac(hash);
          const fullEntry: LedgerEntry = { ...entryWithoutHash, hash, hmac };

          await fs.promises.appendFile(ledger, JSON.stringify(fullEntry) + '\n');
          
          await this.releaseLock(lockHandle);
          resolve(fullEntry);
        } catch (err) {
          if (lockHandle) {
            await this.releaseLock(lockHandle);
          }
          reject(err);
        }
      }).catch(reject);
    });
  }

  async verifyIntegrity(): Promise<{ valid: boolean; corruptedIndex?: number; message: string }> {
    const entries = await this.readAllEntries(-1); // Must read all to verify full chain
    if (entries.length === 0) {
      return { valid: true, message: "Ledger is empty, integrity intact." };
    }

    let expectedPrevHash = '0'.repeat(64);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.previous_hash !== undefined) {
        if (entry.previous_hash !== expectedPrevHash) {
          return {
            valid: false,
            corruptedIndex: i,
            message: `Hash chain broken at index ${i}: Expected previous_hash to be ${expectedPrevHash}, but got ${entry.previous_hash}`
          };
        }

        const entryWithoutHash = {
          timestamp: entry.timestamp,
          tool: entry.tool,
          args: entry.args,
          durationMs: entry.durationMs,
          status: entry.status,
          previous_hash: entry.previous_hash,
        };
        const computedHash = this.calculateHash(entryWithoutHash);
        if (entry.hash !== computedHash) {
          return {
            valid: false,
            corruptedIndex: i,
            message: `Hash mismatch at index ${i}: Computed ${computedHash}, got ${entry.hash}`
          };
        }

        const computedHmac = this.calculateHmac(entry.hash);
        if (entry.hmac !== computedHmac) {
          return {
            valid: false,
            corruptedIndex: i,
            message: `HMAC verification failed at index ${i}`
          };
        }

        expectedPrevHash = entry.hash;
      }
    }

    return { valid: true, message: "All chain links and signatures verified successfully." };
  }

  async replay(fromTimestamp?: string, limit: number = 1000): Promise<any[]> {
    const entries = await this.readAllEntries(-1);
    if (!fromTimestamp) {
      return entries.slice(-limit);
    }
    const fromTime = new Date(fromTimestamp).getTime();
    return entries.filter(e => new Date(e.timestamp).getTime() >= fromTime);
  }

  async search(query: string, limit: number = 100): Promise<any[]> {
    // Pass -1 to readAllEntries to search through all history, but we cap the output to `limit`
    const entries = await this.readAllEntries(-1);
    const lQuery = query.toLowerCase();
    const results = entries.filter(e => {
      const matchTool = e.tool?.toLowerCase().includes(lQuery);
      const matchArgs = JSON.stringify(e.args || {}).toLowerCase().includes(lQuery);
      return matchTool || matchArgs;
    });
    
    // Truncate to protect the LLM context from "Response too long"
    return results.slice(-limit);
  }

  setLedgerPathForTest(p: string) {
    this.ledgerPathOverride = p;
  }
}

export default new ShadowLedger();
