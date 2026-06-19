/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  🔒 Transactional Mutex Lock & Exponential Backoff (V1)    │
 * │  Coordinates asynchronous parallel agent file-system access│
 * │  to prevent overlapping edits and file race conditions.     │
 * └─────────────────────────────────────────────────────────────┘
 */
const fs = require('fs');
const path = require('path');

class MutexLock {
    constructor() {
        this.activeLocks = new Map(); // filePath -> { ownerId, timestamp, expiresAt }
    }

    /**
     * Attempts to acquire a lock on a file path.
     * If locked by another owner, will wait using exponential backoff.
     */
    async acquire(filePath, ownerId = 'system', timeoutMs = 15000, maxRetries = 5) {
        const resolvedPath = path.resolve(filePath);
        let attempt = 0;

        while (attempt < maxRetries) {
            const now = Date.now();
            const currentLock = this.activeLocks.get(resolvedPath);

            // If not locked or lock has expired
            if (!currentLock || currentLock.expiresAt < now) {
                this.activeLocks.set(resolvedPath, {
                    ownerId,
                    timestamp: now,
                    expiresAt: now + timeoutMs
                });
                console.error(`[MutexLock] Acquired lock on ${resolvedPath} for owner [${ownerId}]`);
                return true;
            }

            // Already locked by the same owner - renew lock
            if (currentLock.ownerId === ownerId) {
                currentLock.expiresAt = now + timeoutMs;
                return true;
            }

            // Locked by someone else - calculate exponential backoff delay (e.g. 100ms, 200ms, 400ms...)
            attempt++;
            const delay = Math.pow(2, attempt) * 100 + Math.random() * 50;
            console.error(`[MutexLock] Path ${resolvedPath} is locked by [${currentLock.ownerId}]. Retrying in ${Math.round(delay)}ms (Attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        throw new Error(`[MutexLock] Timeout: Failed to acquire lock on ${resolvedPath} after ${maxRetries} attempts.`);
    }

    /**
     * Releases a lock on a file path if held by the correct owner.
     */
    release(filePath, ownerId = 'system') {
        const resolvedPath = path.resolve(filePath);
        const currentLock = this.activeLocks.get(resolvedPath);

        if (!currentLock) return false;

        if (currentLock.ownerId === ownerId) {
            this.activeLocks.delete(resolvedPath);
            console.error(`[MutexLock] Released lock on ${resolvedPath} by owner [${ownerId}]`);
            return true;
        }

        console.warn(`[MutexLock] Release failed: Owner mismatch for lock on ${resolvedPath}. Expected [${currentLock.ownerId}], got [${ownerId}]`);
        return false;
    }

    /**
     * Check if a path is actively locked.
     */
    isLocked(filePath) {
        const resolvedPath = path.resolve(filePath);
        const currentLock = this.activeLocks.get(resolvedPath);
        if (!currentLock) return false;
        return currentLock.expiresAt > Date.now();
    }
}

// Export a singleton instance
module.exports = new MutexLock();
