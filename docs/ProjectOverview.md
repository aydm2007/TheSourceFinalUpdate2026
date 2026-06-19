# Project Overview

*This document is generated automatically by the Documentation Agent.*

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Core Modules](#core-modules)
4. [Client Application](#client-application)
5. [Security Hardening](#security-hardening)
6. [Build & Deployment](#build--deployment)
7. [Testing](#testing)
8. [Contributing](#contributing)
9. [License](#license)

---

## Introduction

The **Games3d_RaceCar** project is a full‑stack 3‑D racing simulation built with **Three.js** for rendering, a **Node.js/Express** backend, and a **React** front‑end. It includes advanced features such as physics‑based collision detection, real‑time multiplayer support, and a modular plugin system.

## Architecture

- **Backend (`src/`):** Express server, authentication, HMAC verification, game loop, physics engine, and data persistence.
- **Frontend (`client/`):** React components, custom hooks, WebSocket client, and Three.js rendering wrapper (`ThreeEngine.js`).
- **Agents (`agents/`):** Specialized scripts that automate tasks such as 3‑D model generation, audio processing, DevOps pipelines, and QA testing.

## Core Modules

| Module | Purpose |
|--------|---------|
| `src/Server.js` | Entry point, sets up Express, security middleware, and WebSocket routes. |
| `src/GameEngine.js` | Main game loop, updates physics, and broadcasts state. |
| `src/PhysicsEngine.js` (referenced) | Handles collision detection and response using bounding boxes. |
| `src/AdvancedRenderer.js` | Provides a robust WebGL/Canvas rendering pipeline built on Three.js. |
| `client/src/engine/ThreeEngine.js` | Thin wrapper around Three.js for scene management and animation. |
| `client/src/components/ChatUI.jsx` | UI for in‑game chat and notifications. |
| `agents/agent_physics_engineer.js` | Helper utilities for tweaking physics parameters. |

## Client Application

- **Entry Point:** `client/public/index.html` loads `client/public/main.js` which mounts the React app.
- **State Management:** Custom hooks (`useSession`, `statePersistence`) store user preferences (e.g., dark mode) in `localStorage` with graceful fallback.
- **Rendering Loop:** Initialized via `ThreeRenderer.initThreeRenderer({ canvasId: 'myCanvas' })` which creates the scene, camera, lights, and starts the animation frame loop.
- **Networking:** `websocketClient.js` maintains a persistent connection to the backend for real‑time state sync.

## Security Hardening

- **Helmet CSP** with strict directives (`default-src 'self'` etc.).
- **HMAC middleware** validates request integrity; fails closed if the secret is missing.
- **Rate limiting** (to be added) on authentication endpoints.
- **AST mutex locks** protect `bridge.json`, `package/cli.js`, and `aether.ps1` from concurrent edits.

## Build & Deployment

```bash
# Install dependencies
npm ci

# Build client assets
npm run build

# Start the server (production)
npm start
```

The project supports Docker deployment via the provided `Dockerfile` (not shown here) and CI pipelines that run `npm audit`, `npm prune`, and the generated **VisualAuditReport**.

## Testing

- **Unit tests** (`npm test`) cover backend utilities and React components.
- **Performance tests** (`npm run perf:buffer`) benchmark MessagePack serialization.
- **Security tests** (`npm audit`) are run automatically on CI.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome-feature`).
3. Follow the coding style enforced by ESLint and Prettier.
4. Submit a pull request with a clear description and reference the relevant issue.

## License

This project is licensed under the **MIT License**.

---

*Generated on $(date) by the Documentation Agent.*

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-17T23:25:14.468Z`
> **Cryptographic IQ Hash:** `78606018cf19680c...`
<!-- SOV_HASH:78606018cf19680cdf5446d1defd21919602ef5f69b7cabd68545f6fcc0e1ff3 -->
