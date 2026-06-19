try {
  if (!globalThis.__AETHER_DEV_PLATFORM_BOOTSTRAPPED__) {
    const { bootstrapDeveloperPlatform } = require('./dev-platform/bootstrap.js');
    bootstrapDeveloperPlatform({
      workspaceRoot: process.env.AETHER_WORKSPACE_ROOT || process.cwd(),
      source: 'package/preload.js'
    });
  }
} catch (error) {
  console.warn('[Aether-DevPlatform] bootstrap skipped:', error && error.message ? error.message : error);
}
