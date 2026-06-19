export class SemanticLockManager {
  private locks: Map<string, { agentId: string; expiresAt: number }> = new Map();

  /**
   * Attempts to acquire a lock on a specific resource (file path, task ID, AST node).
   * @param resourceId Unique identifier for the resource to lock.
   * @param agentId The ID of the agent requesting the lock.
   * @param timeoutMs How long the lock should be held before auto-expiring.
   * @returns boolean True if acquired, false if currently locked by someone else.
   */
  public acquireLock(resourceId: string, agentId: string, timeoutMs: number = 30000): boolean {
    const now = Date.now();
    const existingLock = this.locks.get(resourceId);

    // If there is an active lock held by a DIFFERENT agent
    if (existingLock && existingLock.expiresAt > now && existingLock.agentId !== agentId) {
      return false; // Locked by another agent
    }

    // Otherwise, grant or renew the lock
    this.locks.set(resourceId, {
      agentId,
      expiresAt: now + timeoutMs,
    });

    return true;
  }

  /**
   * Checks if a resource is currently locked by any agent.
   */
  public isLocked(resourceId: string): boolean {
    const now = Date.now();
    const existingLock = this.locks.get(resourceId);
    return existingLock !== undefined && existingLock.expiresAt > now;
  }

  /**
   * Releases a lock on a specific resource.
   * @param resourceId The resource to unlock.
   * @param agentId The ID of the agent trying to release it. Must match the owner.
   * @returns boolean True if released, false if not owned by this agent.
   */
  public releaseLock(resourceId: string, agentId: string): boolean {
    const existingLock = this.locks.get(resourceId);
    
    if (!existingLock) return true; // Already unlocked
    
    if (existingLock.agentId !== agentId) {
      return false; // Cannot release someone else's lock
    }

    this.locks.delete(resourceId);
    return true;
  }

  /**
   * Clears all expired locks to free up memory.
   */
  public purgeExpiredLocks(): void {
    const now = Date.now();
    for (const [resourceId, lock] of this.locks.entries()) {
      if (lock.expiresAt <= now) {
        this.locks.delete(resourceId);
      }
    }
  }
}

// Global Singleton Instance for the Swarm
export const globalSemanticLock = new SemanticLockManager();
