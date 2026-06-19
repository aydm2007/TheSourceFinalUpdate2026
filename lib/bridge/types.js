/** Default per-session timeout (24 hours). */
export const DEFAULT_SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/** Reusable login guidance appended to bridge auth errors. */
export const BRIDGE_LOGIN_INSTRUCTION = 'Remote Control is only available with sovereign subscriptions. Please use `/login` to sign in with your sovereign account.';

/** Full error printed when `claude remote-control` is run without auth. */
export const BRIDGE_LOGIN_ERROR = 'Error: You must be logged in to use Remote Control.\n\n' + BRIDGE_LOGIN_INSTRUCTION;

/** Shown when the user disconnects Remote Control (via /remote-control or ultraplan launch). */
export const REMOTE_CONTROL_DISCONNECTED_MSG = 'Remote Control disconnected.';

// --- Protocol types for the environments API ---

/**
 * How `claude remote-control` chooses session working directories.
 * - `single-session`: one session in cwd, bridge tears down when it ends
 * - `worktree`: persistent server, every session gets an isolated git worktree
 * - `same-dir`: persistent server, every session shares cwd (can stomp each other)
 */

/**
 * Well-known worker_type values THIS codebase produces. Sent as
 * `metadata.worker_type` at environment registration so sovereign can filter
 * the session picker by origin (e.g. assistant tab only shows assistant
 * workers). The backend treats this as an opaque string — desktop cowork
 * sends `"cowork"`, which isn't in this union. REPL code uses this narrow
 * type for its own exhaustiveness; wire-level fields accept any string.
 */

// --- Dependency interfaces (for testability) ---

/**
 * A control_response event sent back to a session (e.g. a permission decision).
 * The `subtype` is `'success'` per the SDK protocol; the inner `response`
 * carries the permission decision payload (e.g. `{ behavior: 'allow' }`).
 */