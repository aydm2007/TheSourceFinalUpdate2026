/**
 * Minimal ESLint plugin that re‑exports the custom rules defined in the
 * `eslint-rules/` directory. By naming the file `eslint-plugin-custom-rules.js`
 * ESLint can resolve the plugin name `custom-rules` without needing to publish
 * a separate npm package.
 */
module.exports = {
  rules: {
    "no-process-env-top-level": require("./eslint-rules/no-process-env-top-level"),
    "no-sync-fs": require("./eslint-rules/no-sync-fs"),
    "no-top-level-side-effects": require("./eslint-rules/no-top-level-side-effects"),
    "no-process-exit": require("./eslint-rules/no-process-exit"),
  },
};
