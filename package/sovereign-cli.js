#!/usr/bin/env node
/**
 * @file sovereign-cli.js
 * @description The Sovereign CLI Edge - Dynamic entrypoint with Bypass directives and Source Mapping.
 */

const fs = require('fs');
const path = require('path');
const { SovereignKernel } = require('./SovereignKernel');

// 1. تفعيل الخريطة الجنائية تلقائياً لمعالجة الأخطاء
try {
  require('source-map-support').install({
    handleUncaughtExceptions: false 
  });
} catch (e) {
  console.warn('[CLI] source-map-support not found, skipping source mapping.');
}

class CLICommander {
  constructor() {
    this.args = process.argv.slice(2);
    this.kernel = new SovereignKernel(process.cwd());
  }

  parseBypassDirectives() {
    return {
      autoBypass: this.args.includes('--auto-bypass'),
      injectScript: this.getArgumentValue('--inject-script'),
      injectSecrets: this.getArgumentValue('--inject-secrets'),
      forceConsensus: this.args.includes('--force-consensus'),
      ignoreDeadNodes: this.args.includes('--ignore-dead-nodes')
    };
  }

  getArgumentValue(flag) {
    const index = this.args.indexOf(flag);
    return index !== -1 && this.args[index + 1] ? this.args[index + 1] : null;
  }

  async execute() {
    try {
      const directives = this.parseBypassDirectives();

      // 2. تطبيق سكربتات التخطي بكل سهولة إذا تم تمريرها كباراميتر
      if (directives.injectScript) {
        const scriptPath = path.resolve(process.cwd(), directives.injectScript);
        if (fs.existsSync(scriptPath)) {
          console.log(`[SOVEREIGN-CLI] Injecting bypass script: ${scriptPath}`);
          const bypassModule = require(scriptPath);
          await bypassModule.applyBypass(this.kernel);
        }
      }

      // Initialize Vault before boot if secrets provided
      if (directives.injectSecrets && this.kernel.vault) {
          this.kernel.vault.loadSecrets(process.env, directives);
      }

      // 3. تشغيل النواة مع تمرير باراميترات الحماية
      await this.kernel.boot({
        enableAutoBypass: directives.autoBypass,
        overrideConsensus: directives.forceConsensus
      });

      console.log(`[SOVEREIGN-CLI] Kernel executing successfully.`);

    } catch (error) {
      await this.handleFatalError(error);
    }
  }

  // 4. التوجيه العكسي باستخدام cli.js.map
  async handleFatalError(error) {
    console.error('[FATAL] CLI Execution crashed.');
    const shadowLedgerEntry = {
      timestamp: new Date().toISOString(),
      level: 'CRITICAL',
      type: 'CLI_CRASH',
      message: error.message,
      mappedStack: error.stack 
    };
    
    // Fallback shadow ledger writing
    const varDir = path.join(process.cwd(), 'var');
    if (!fs.existsSync(varDir)) fs.mkdirSync(varDir);
    fs.appendFileSync(path.join(varDir, 'shadow_ledger.jsonl'), JSON.stringify(shadowLedgerEntry) + '\n');
    
    process.exit(1);
  }
}

// If run directly
if (require.main === module) {
  new CLICommander().execute();
}

module.exports = { CLICommander };
