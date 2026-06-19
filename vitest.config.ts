// vitest configuration – auto generated
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // FIX-1: forks pool — isolates each test suite in a separate OS process.
    // Prevents EADDRINUSE when multiple suites try to bind ports 9999/9998 concurrently.
    pool: 'forks',
    isolate: true,
    coverage: { reporter: ['text', 'json', 'html'] },
    include: ['src/tools/__tests__/**/*.test.{ts,tsx}', 'src/core/__tests__/**/*.test.{ts,tsx}', 'src/core/memory/__tests__/**/*.test.{ts,tsx}', 'src/core/swarm/__tests__/**/*.test.{ts,tsx}', 'src/core/daemon/__tests__/**/*.test.{ts,tsx}', 'src/core/evolution/__tests__/**/*.test.{ts,tsx}', 'tests/**/*.test.{js,mjs,ts,tsx}'],
    exclude: [
      'tests/billing_rbac.test.js',
      'tests/bridgeHealth.test.js',
      // FIX-10: requires a live server on :9999 — integration test, run manually
      'tests/test_proxy_endpoint.js',
      '**/node_modules/**',
      '**/dist/**'
    ],
    testTimeout: 30000,
    // FIX-1: allow time for open sockets/servers to fully close between suites
    teardownTimeout: 10000
  },
  resolve: {
    alias: {
      src: resolve('src'),
      'bun:bundle': resolve('src/utils/bun-bundle-mock.ts')
    }
  },
  esbuild: {
    target: 'es2022'
  }
});

