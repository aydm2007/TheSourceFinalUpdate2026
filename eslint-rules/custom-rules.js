module.exports = {
  rules: {
    'no-process-env-top-level': { create: () => ({}) },
    'no-sync-fs': { create: () => ({}) },
    'no-top-level-side-effects': { create: () => ({}) },
    'no-process-cwd': { create: () => ({}) }
  }
};
