// Mock file for bun:bundle to allow Vitest tests to run outside Bun environment
export function feature(name: string): boolean {
  if (name === 'ULTRATHINK') return true;
  return process.env[`FEATURE_${name}`] === 'true';
}
