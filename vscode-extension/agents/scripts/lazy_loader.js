/**
 * 🟣 LazyLoader — Sovereign Lazy Loading for Aether Engine V11.0
 * Part of: Phase 2 — 85 → 92
 * 
 * Usage: node lazy_loader.js --module=webfetch [--cmd=status|load|unload]
 * Manages on-demand tool loading to minimize startup cost.
 */

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;
const MANIFEST_PATH = path.join(__dirname, '..', 'memory', 'telepathy', 'module_manifest.json');

class LazyLoader {
  constructor() {
    this.loaded = new Map();
    this.manifest = this.loadManifest();
    this.stats = { loads: 0, unloads: 0, cache_hits: 0, errors: 0 };
  }

  loadManifest() {
    try {
      if (fs.existsSync(MANIFEST_PATH)) {
        return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
      }
    } catch (e) { /* ignore */ }

    // Auto-discover
    return this.discoverModules();
  }

  discoverModules() {
    const manifest = { modules: {}, discovered: new Date().toISOString() };
    try {
      const files = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.js') && f !== 'lazy_loader.js');
      for (const file of files) {
        const name = file.replace('.js', '');
        const stat = fs.statSync(path.join(SCRIPTS_DIR, file));
        manifest.modules[name] = {
          file,
          size_kb: Math.round(stat.size / 1024 * 100) / 100,
          category: this.categorize(name),
          dependencies: [],
          load_count: 0,
          last_loaded: null
        };
      }
      fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    } catch (e) { /* ignore */ }
    return manifest;
  }

  categorize(name) {
    const cats = {
      'glob_tool': '👁️ The Vision',
      'web_fetch': '👁️ The Vision',
      'web_search': '👁️ The Vision',
      'tool_search': '📊 The Sovereign',
      'token_estimator': '📊 The Sovereign',
      'state_machine': '🧪 The Fusion',
      'permission_callbacks': '🛡️ Security',
      'context_compressor': '🧪 The Fusion',
      'sleep_tool': '🦿 The Echo',
      'enter_plan_mode': '🧠 The Head',
      'exit_plan_mode': '🧠 The Head',
    };
    return cats[name] || '📦 Uncategorized';
  }

  load(moduleName) {
    if (this.loaded.has(moduleName)) {
      this.stats.cache_hits++;
      return { success: true, module: moduleName, cached: true, exports: this.loaded.get(moduleName) };
    }

    const mod = this.manifest.modules[moduleName];
    if (!mod) {
      this.stats.errors++;
      return { success: false, error: `Module not found: ${moduleName}` };
    }

    try {
      const modulePath = path.join(SCRIPTS_DIR, mod.file);
      // Clear require cache for fresh load
      delete require.cache[require.resolve(modulePath)];
      const exports = require(modulePath);
      
      this.loaded.set(moduleName, exports);
      this.stats.loads++;
      mod.load_count = (mod.load_count || 0) + 1;
      mod.last_loaded = new Date().toISOString();
      
      // Update manifest
      try { fs.writeFileSync(MANIFEST_PATH, JSON.stringify(this.manifest, null, 2)); } catch (e) {}

      return { success: true, module: moduleName, cached: false, exports };
    } catch (err) {
      this.stats.errors++;
      return { success: false, error: err.message, module: moduleName };
    }
  }

  unload(moduleName) {
    if (!this.loaded.has(moduleName)) {
      return { success: false, error: `Module not loaded: ${moduleName}` };
    }

    const mod = this.manifest.modules[moduleName];
    if (mod) {
      try { delete require.cache[require.resolve(path.join(SCRIPTS_DIR, mod.file))]; } catch (e) {}
    }

    this.loaded.delete(moduleName);
    this.stats.unloads++;
    return { success: true, module: moduleName, unloaded: true };
  }

  status() {
    return {
      manifest: {
        total_modules: Object.keys(this.manifest.modules).length,
        discovered: this.manifest.discovered
      },
      loaded: {
        count: this.loaded.size,
        modules: Array.from(this.loaded.keys())
      },
      stats: this.stats,
      modules: Object.entries(this.manifest.modules).map(([name, mod]) => ({
        name,
        category: mod.category,
        size_kb: mod.size_kb,
        loaded: this.loaded.has(name),
        load_count: mod.load_count || 0,
        last_loaded: mod.last_loaded
      }))
    };
  }

  preload(category = null) {
    const results = [];
    for (const [name, mod] of Object.entries(this.manifest.modules)) {
      if (!category || mod.category === category) {
        results.push({ name, ...this.load(name) });
      }
    }
    return results;
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args.find(a => a.startsWith('--cmd='))?.split('=')[1] || 'status';
  const moduleName = args.find(a => a.startsWith('--module='))?.split('=')[1];

  const loader = new LazyLoader();

  switch (cmd) {
    case 'status':
      console.log(JSON.stringify(loader.status(), null, 2));
      break;
    case 'load':
      if (!moduleName) {
        console.log(JSON.stringify({ error: '--module=name required' }));
        process.exit(1);
      }
      console.log(JSON.stringify(loader.load(moduleName), null, 2));
      break;
    case 'unload':
      if (!moduleName) {
        console.log(JSON.stringify({ error: '--module=name required' }));
        process.exit(1);
      }
      console.log(JSON.stringify(loader.unload(moduleName), null, 2));
      break;
    case 'preload':
      const cat = args.find(a => a.startsWith('--category='))?.split('=')[1];
      console.log(JSON.stringify(loader.preload(cat), null, 2));
      break;
    default:
      console.log(JSON.stringify(loader.status(), null, 2));
  }
}

module.exports = { LazyLoader };
