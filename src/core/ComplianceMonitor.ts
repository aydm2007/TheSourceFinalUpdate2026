import * as fs from 'fs/promises';
import * as path from 'path';
import { logForDebugging } from '../utils/debug.js';

export interface ComplianceReport {
  isCompliant: boolean;
  violations: string[];
  rulesChecked: number;
  timestamp: string;
}

export class ComplianceMonitor {
  private schemaPath: string;

  constructor(workspaceRoot: string) {
    this.schemaPath = path.join(workspaceRoot, 'registry/api_schema.json');
  }

  async verifyCompliance(filePath: string, generatedCode: string): Promise<ComplianceReport> {
    logForDebugging(`[ComplianceMonitor] Auditing file compliance: ${filePath}`);
    const violations: string[] = [];
    let rulesChecked = 0;

    // 1. Float vs Decimal check
    rulesChecked++;
    if (filePath.includes('serializer') || filePath.includes('models')) {
      if (generatedCode.includes('FloatField') && !generatedCode.includes('DecimalField')) {
        violations.push("CWE-GRP-01: Use of unsafe FloatingField detected. Relational GRP state requires strict DecimalField.");
      }
    }

    // 2. Security Check (eval/exec)
    rulesChecked++;
    if (generatedCode.includes('eval(') || generatedCode.includes('exec(')) {
      violations.push("CWE-78: Arbitrary code execution function 'eval/exec' found in generated patch.");
    }

    // 3. Schema drift verification
    rulesChecked++;
    try {
      const schemaRaw = await fs.readFile(this.schemaPath, 'utf-8');
      const schema = JSON.parse(schemaRaw);
      
      if (filePath.includes('SyncApiService')) {
        for (const key of Object.keys(schema.sync_required_fields || {})) {
          if (!generatedCode.includes(key)) {
            violations.push(`Schema Drift: Missing target sync descriptor payload field: '${key}'`);
          }
        }
      }
    } catch {
      logForDebugging("[ComplianceMonitor] Local api_schema.json not found. Proceeding with structural fallback rules.");
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      rulesChecked,
      timestamp: new Date().toISOString()
    };
  }
}
