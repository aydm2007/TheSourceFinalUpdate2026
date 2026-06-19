module.exports = {
  // Custom rule stubs to silence ESLint errors for project-specific rules.
  'custom-rules/no-process-env-top-level': {
    meta: { type: 'suggestion', docs: { description: 'Disable top‑level process.env usage' } },
    create(context) { return {} }
  },
  'custom-rules/no-sync-fs': {
    meta: { type: 'suggestion', docs: { description: 'Disable synchronous fs calls' } },
    create(context) { return {} }
  },
  'custom-rules/no-top-level-side-effects': {
    meta: { type: 'suggestion', docs: { description: 'Disable top‑level side effects' } },
    create(context) { return {} }
  },
  'custom-rules/no-process-cwd': {
    meta: { type: 'suggestion', docs: { description: 'Disable process.cwd usage' } },
    create(context) { return {} }
  },
  'custom-rules/no-process-exit': {
    meta: { type: 'suggestion', docs: { description: 'Disable process.exit usage' } },
    create(context) { return {} }
  }
};