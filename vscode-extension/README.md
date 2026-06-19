# Nexus Sovereign Agent (Omega) — VS Code Extension

This folder contains a VS Code extension that provides a Sovereign AI agent UI (dashboard + chat) integrated with TheSource project.

Quick features:

- Dashboard: `dashboard_ui.html` — project root, SiliconFlow keys, model switcher, skills list, logs.
- Chat: `chat_ui.html` — conversation UI with code copy/insert and quick tasks.
- Bridge: `nexus_bridge.js` — local simulator used to run skills and diagnostics.
- Commands:
  - `nexus.selectProjectRoot` — choose project root folder
  - `nexus.switchModel` — change SiliconFlow model
  - `nexus.atomicRepair` — run Omega diagnostic
  - `nexus.explainCode` — explain selected code

Run quick local checks:

```bash
cd vscode-extension
node run_tests.js
```

Run tests via npm:

```bash
cd vscode-extension
npm test
```

Next steps:
- Add automated unit/integration tests for `nexus_bridge.js` flows.
- Write packaging steps to publish the extension if desired.

Packaging and publishing
-----------------------

To create a `.vsix` package locally (requires `vsce` available via npx):

```bash
cd vscode-extension
npx vsce package
```

To publish to the Visual Studio Marketplace from CI, add a repository secret named `VSCE_PAT` with a publisher Personal Access Token and use the provided GitHub Actions workflow `.github/workflows/publish-extension.yml`.

The workflow runs tests and packages the extension; it will publish only if `VSCE_PAT` is set.
