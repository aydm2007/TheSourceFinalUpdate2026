# Architectural Redesign Overview

## Goals
- **Scalability**: Separate concerns into independent modules that can be horizontally scaled (e.g., chat service, rendering service, API gateway).
- **Modularity**: Introduce a plugin‑style system for the chat UI so new features (i18n, attachments, audio, bots) can be added without touching core code.
- **Maintainability**: Clear folder hierarchy, strict import boundaries, and shared utility library.

## Proposed Folder Layout
```
src/
│   index.js                # Application entry point
│
├─ core/                     # Core engine (event loop, state management)
│   ├─ state.js
│   └─ dispatcher.js
│
├─ services/                 # Business‑logic services (stateless)
│   ├─ chat/                 # Chat service (plugin host)
│   │   ├─ plugins/          # Individual chat plugins
│   │   │   ├─ i18n.js       # Internationalisation plugin
│   │   │   ├─ attachment.js # File‑upload handling plugin
│   │   │   └─ audio.js      # Audio playback plugin
│   │   └─ chatService.js    # Orchestrates plugins
│   ├─ rendering/            # 3‑D rendering service
│   │   ├─ renderer.js       # Thin wrapper around Three.js
│   │   └─ shaders/          # Custom GLSL shaders
│   └─ analytics/            # Telemetry & logging
│
├─ ui/                       # Front‑end assets
│   ├─ dashboard.html       # Main dashboard page
│   ├─ styles/              # CSS / SCSS files
│   └─ scripts/             # UI‑specific JavaScript (chat UI, controls)
│
├─ utils/                    # Re‑usable helpers (fetch wrapper, validation, etc.)
│   └─ logger.js
│
└─ config/                   # Configuration files (env, feature flags)
    └─ featureFlags.json
```

## Plugin‑Style Chat System
- **Plugin Interface** (`ChatPlugin`):
  ```js
  export default class ChatPlugin {
    constructor(chatService) { this.chatService = chatService; }
    // Called when a user sends a message
    async onMessage(message, attachment) {}
    // Optional: return UI elements to inject into the chat bar
    getToolbarElements() { return null; }
  }
  ```
- **Built‑in Plugins**:
  - **i18n** – Provides `translate(key, locale)` and swaps UI strings on language change.
  - **attachment** – Handles `<input type="file">` selection, validates size/type, and forwards the file to the Sigma API.
  - **audio** – Receives `audioUrl` from the API response and plays it; respects the global `audioEnabled` flag.
- **Extensibility** – New plugins can be dropped into `src/services/chat/plugins/` and automatically registered by `chatService.js`.

## Migration Steps (High‑Level)
1. **Add folder skeleton** (`core`, `services`, `ui`, `utils`, `config`).
2. **Move existing files** into the new structure while preserving relative import paths (use `FileEdit` with regex to update imports).
3. **Extract chat UI logic** from `dashboard.html` into `ui/scripts/chat.js` and load it via a `<script src="/ui/scripts/chat.js"></script>` tag.
4. **Create plugin files** (`i18n.js`, `attachment.js`, `audio.js`) implementing the `ChatPlugin` contract.
5. **Refactor `chatService.js`** to load plugins dynamically using `require.context` (Webpack) or a simple `fs.readdirSync` loop.
6. **Update ESLint & TypeScript configs** to reflect new path aliases (`@core/*`, `@services/*`, `@ui/*`).
7. **Run `FullRepairLoop`** to auto‑fix linting issues introduced by the move.
8. **Execute `ParallelTest`** to ensure all existing unit tests still pass.
9. **Generate a visual audit** (`VisualAuditReport`) and record the entire operation in `shadow_ledger.jsonl`.

## Documentation Updates
- **skill.md** – Add a section *"Creating a Chat Plugin"* with a step‑by‑step example.
- **master.md** – Add an *"Architecture"* chapter summarising the new layout and plugin system.

---

*All steps above are ready to be translated into concrete `FileEdit`, `FileWrite`, `EnterWorktree`, and `FullRepairLoop` tool calls as the next phase of the architectural redesign.*

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-18T09:54:51.127Z`
> **Cryptographic IQ Hash:** `1ae9ec722b4b4dcc...`
<!-- SOV_HASH:1ae9ec722b4b4dcc26b411b96d69f23b065e5616e85835439fdccdb78199906d -->
