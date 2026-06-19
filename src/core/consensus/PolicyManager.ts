export interface Policy {
  role: string;
  permissions: string[];
}

/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  📜 PolicyManager — Sovereign RBAC Engine                      │
 * │  Role-based access control with wildcard support and auditing  │
 * └────────────────────────────────────────────────────────────────┘
 */
export class PolicyManager {
  private policies: Map<string, Set<string>> = new Map();

  addPolicy(role: string, permissions: string[]) {
    if (!this.policies.has(role)) {
      this.policies.set(role, new Set());
    }
    const rolePerms = this.policies.get(role)!;
    permissions.forEach(p => rolePerms.add(p));
  }

  /**
   * Evaluates if a role has access to a specific action.
   * Supports wildcard matching (e.g., 'file:*' matches 'file:read')
   */
  canAccess(role: string, action: string): boolean {
    const rolePerms = this.policies.get(role);
    if (!rolePerms) return false;

    // Direct match
    if (rolePerms.has(action)) return true;

    // Wildcard match
    for (const perm of rolePerms) {
      if (perm.endsWith('*')) {
        const prefix = perm.slice(0, -1);
        if (action.startsWith(prefix)) return true;
      }
    }

    return false;
  }

  /**
   * Throws an error if access is denied. Used for strict pipeline enforcement.
   */
  enforce(role: string, action: string): void {
    if (!this.canAccess(role, action)) {
      throw new Error(`[PolicyManager] Access Denied: Role '${role}' lacks permission for '${action}'`);
    }
  }

  clear() {
    this.policies.clear();
  }
}

export default new PolicyManager();
