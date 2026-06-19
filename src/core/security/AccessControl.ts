class AccessControl {
  private permissions = new Map<string, string[]>();

  grant(agent: string, action: string) {
    const list = this.permissions.get(agent) || [];
    list.push(action);
    this.permissions.set(agent, list);
  }

  authorize(agent: string, action: string): boolean {
    const list = this.permissions.get(agent);
    return list?.includes(action) ?? false;
  }

  clear() {
    this.permissions.clear();
  }
}

export default new AccessControl();
