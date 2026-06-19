const dbManager = require('../db/db_manager.js');

class MultiUserManager {
  async getUserByKey(apiKey) {
    try {
      return await dbManager.getUserByApiKey(apiKey);
    } catch (e) {
      console.error(`[MultiUser] Error fetching user by api key: ${e.message}`);
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      await dbManager.ensureInit();
      const user = await dbManager.db.get(
        'SELECT id, username, apikey, role, allowed_tools FROM users WHERE username = ?',
        [username]
      );
      if (!user) return null;
      try {
        user.allowed_tools = JSON.parse(user.allowed_tools);
      } catch {
        user.allowed_tools = user.allowed_tools ? [user.allowed_tools] : ['*'];
      }
      return user;
    } catch (e) {
      console.error(`[MultiUser] Error fetching user by username: ${e.message}`);
      return null;
    }
  }

  isToolAllowed(user, toolName) {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (Array.isArray(user.allowed_tools)) {
      if (user.allowed_tools.includes('*')) return true;
      return user.allowed_tools.includes(toolName);
    }
    return false;
  }
}

module.exports = new MultiUserManager();

