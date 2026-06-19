import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { SessionResource, SessionContext } from './api.js';

/**
 * Sovereign Local Context Relay (SLCR) — V2.0
 *
 * Enables zero-latency context transfer for in-process swarm agents.
 * Bypasses cloud APIs when agents are running in the same memory space.
 *
 * V2.0 Enhancements:
 *  - EventListener support: agents can subscribe to session events
 *  - TTL-based session expiry: auto-purges stale sessions
 *  - Context diffing: only broadcasts updated fields
 */

export type LocalSession = SessionResource & {
    isLocal: true;
    /** Epoch ms when this session was last accessed */
    lastAccessedAt: number;
    /** TTL in ms. 0 = never expires. */
    ttlMs: number;
};

export type SessionEventType = 'created' | 'updated' | 'message' | 'closed';

export type SessionEvent = {
    type: SessionEventType;
    sessionId: string;
    payload?: unknown;
    timestamp: string;
};

type SessionEventListener = (event: SessionEvent) => void;

const localSessions = new Map<string, LocalSession>();
const contextStorage = new AsyncLocalStorage<{ sessionId: string }>();
const eventListeners = new Map<string, Set<SessionEventListener>>();

/** Default TTL for local sessions: 30 minutes */
const DEFAULT_TTL_MS = 30 * 60 * 1000;

/**
 * Purge sessions that have exceeded their TTL.
 * Called lazily on get/list operations.
 */
function purgeExpiredSessions(): void {
    const now = Date.now();
    for (const [id, session] of localSessions.entries()) {
        if (session.ttlMs > 0 && (now - session.lastAccessedAt) > session.ttlMs) {
            localSessions.delete(id);
            eventListeners.delete(id);
        }
    }
}

/**
 * Broadcast an event to all listeners subscribed to a session.
 */
function broadcast(sessionId: string, event: SessionEvent): void {
    const listeners = eventListeners.get(sessionId);
    if (!listeners) return;
    for (const listener of listeners) {
        try {
            listener(event);
        } catch {
            // Listeners must not crash the relay
        }
    }
}

export function registerLocalSession(
    id: string,
    context: SessionContext,
    title: string,
    ttlMs = DEFAULT_TTL_MS,
): LocalSession {
    const now = Date.now();
    const session: LocalSession = {
        isLocal: true,
        type: 'session',
        id,
        title,
        session_status: 'idle',
        environment_id: 'local-apex',
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
        session_context: context,
        lastAccessedAt: now,
        ttlMs,
    };
    localSessions.set(id, session);
    broadcast(id, {
        type: 'created',
        sessionId: id,
        payload: { title, context },
        timestamp: new Date(now).toISOString(),
    });
    return session;
}

export function getLocalSession(id: string): LocalSession | undefined {
    purgeExpiredSessions();
    const session = localSessions.get(id);
    if (session) {
        session.lastAccessedAt = Date.now();
    }
    return session;
}

export function updateLocalSessionContext(
    id: string,
    context: Partial<SessionContext>,
): boolean {
    const session = localSessions.get(id);
    if (!session) return false;

    const previousContext = { ...session.session_context };
    session.session_context = {
        ...session.session_context,
        ...context,
    };
    session.updated_at = new Date().toISOString();
    session.lastAccessedAt = Date.now();

    // Broadcast only the diff
    const diff: Partial<SessionContext> = {};
    for (const key of Object.keys(context) as (keyof SessionContext)[]) {
        if (JSON.stringify(context[key]) !== JSON.stringify(previousContext[key])) {
            (diff as Record<string, unknown>)[key] = context[key];
        }
    }

    if (Object.keys(diff).length > 0) {
        broadcast(id, {
            type: 'updated',
            sessionId: id,
            payload: diff,
            timestamp: session.updated_at,
        });
    }

    return true;
}

/**
 * Send an in-process event to all listeners of a session.
 * Used by local sub-agents to communicate without cloud API calls.
 */
export function sendLocalSessionEvent(
    sessionId: string,
    payload: unknown,
): boolean {
    const session = localSessions.get(sessionId);
    if (!session) return false;

    const timestamp = new Date().toISOString();
    session.lastAccessedAt = Date.now();

    broadcast(sessionId, {
        type: 'message',
        sessionId,
        payload,
        timestamp,
    });
    return true;
}

/**
 * Subscribe to events for a session.
 * Returns an unsubscribe function.
 */
export function subscribeToSession(
    sessionId: string,
    listener: SessionEventListener,
): () => void {
    if (!eventListeners.has(sessionId)) {
        eventListeners.set(sessionId, new Set());
    }
    eventListeners.get(sessionId)!.add(listener);
    return () => {
        eventListeners.get(sessionId)?.delete(listener);
    };
}

/**
 * Close a local session, broadcasting a closed event and removing it.
 */
export function closeLocalSession(sessionId: string): boolean {
    if (!localSessions.has(sessionId)) return false;
    broadcast(sessionId, {
        type: 'closed',
        sessionId,
        payload: null,
        timestamp: new Date().toISOString(),
    });
    localSessions.delete(sessionId);
    eventListeners.delete(sessionId);
    return true;
}

export function listLocalSessions(): LocalSession[] {
    purgeExpiredSessions();
    return Array.from(localSessions.values());
}

export const slcr = {
    register: registerLocalSession,
    get: getLocalSession,
    update: updateLocalSessionContext,
    sendEvent: sendLocalSessionEvent,
    subscribe: subscribeToSession,
    close: closeLocalSession,
    list: listLocalSessions,
};
