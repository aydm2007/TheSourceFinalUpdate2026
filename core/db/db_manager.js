const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

class DatabaseManager {
  constructor() {
    this.dbPath = path.resolve(__dirname, '..', '..', 'config', 'database.db');
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    await this.runMigrations();
    await this.seedFromLegacyConfigs();
    this.initialized = true;
    console.error('[DB-Manager] Persistence database initialized successfully.');
  }

  // Public method for external modules to guarantee DB readiness
  async ensureInit() {
    if (!this.initialized) await this.init();
  }

  async runMigrations() {
    // Create users table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        apikey TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        allowed_tools TEXT NOT NULL
      )
    `);

    // Create projects table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        description TEXT,
        allowed_tools TEXT,
        enforcement_mode TEXT DEFAULT 'STRICT'
      )
    `);

    // Create wallets table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id TEXT PRIMARY KEY,
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'CREDITS',
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Create usage_logs table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        tool_name TEXT,
        duration_ms REAL,
        cost REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Performance indexes for Admin dashboard queries
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp DESC)`);
    await this.db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_logs_tool_name ON usage_logs(tool_name)`);

    // Create tool_prices table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS tool_prices (
        tool_name TEXT PRIMARY KEY,
        price REAL DEFAULT 0.5
      )
    `);

    // Create admin_audit_logs table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        target_user TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vouchers table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS vouchers (
        code TEXT PRIMARY KEY,
        value REAL NOT NULL,
        is_redeemed INTEGER DEFAULT 0,
        redeemed_by TEXT,
        redeemed_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure all users have a wallet
    await this.db.exec(`
      INSERT OR IGNORE INTO wallets (user_id, balance, currency)
      SELECT id, 1000.0, 'CREDITS' FROM users
    `);
  }

  async seedFromLegacyConfigs() {
    // Check if users table is empty
    const userCountRow = await this.db.get('SELECT COUNT(*) as count FROM users');
    if (userCountRow.count === 0) {
      console.error('[DB-Manager] Seeding users table from legacy config/users.json...');
      const legacyUsersPath = path.join(__dirname, '..', '..', 'config', 'users.json');
      if (fs.existsSync(legacyUsersPath)) {
        try {
          const raw = fs.readFileSync(legacyUsersPath, 'utf8');
          const data = JSON.parse(raw);
          const users = data.users || [];
          for (const u of users) {
            const apiKey = this.resolveConfiguredSecret(u.apikey, u.apikey_env);
            if (!apiKey) {
              console.warn(`[DB-Manager] Skipping user '${u.username}' because no API key environment value is configured.`);
              continue;
            }
            await this.db.run(
              'INSERT INTO users (id, username, apikey, role, allowed_tools) VALUES (?, ?, ?, ?, ?)',
              [u.id, u.username, apiKey, u.role, JSON.stringify(u.allowed_tools || [])]
            );
          }
          console.error(`[DB-Manager] Successfully seeded ${users.length} users.`);
        } catch (e) {
          console.error(`[DB-Manager] Failed to seed legacy users: ${e.message}`);
        }
      }
    }

    // Check if projects table is empty
    const projectCountRow = await this.db.get('SELECT COUNT(*) as count FROM projects');
    if (projectCountRow.count === 0) {
      console.error('[DB-Manager] Seeding projects table from legacy config/projects.json...');
      const legacyProjectsPath = path.join(__dirname, '..', '..', 'config', 'projects.json');
      const globalBridgePath = path.join(__dirname, '..', '..', 'bridge.json');
      
      let defaultAllowedTools = [];
      try {
        if (fs.existsSync(globalBridgePath)) {
          const bridgeConfig = JSON.parse(fs.readFileSync(globalBridgePath, 'utf8'));
          defaultAllowedTools = bridgeConfig.allowed_tools || [];
        }
      } catch (e) {
        console.warn(`[DB-Manager] Could not read global bridge.json for default allowed tools: ${e.message}`);
      }

      if (fs.existsSync(legacyProjectsPath)) {
        try {
          const raw = fs.readFileSync(legacyProjectsPath, 'utf8');
          const data = JSON.parse(raw);
          const projects = data.projects || [];
          for (const p of projects) {
            // Read project-specific bridge.json allowed_tools if it exists
            let projectAllowedTools = defaultAllowedTools;
            let enforcementMode = 'STRICT';
            const projBridgePath = path.join(p.path, 'bridge.json');
            
            if (fs.existsSync(projBridgePath)) {
              try {
                const projBridge = JSON.parse(fs.readFileSync(projBridgePath, 'utf8'));
                if (projBridge.allowed_tools) projectAllowedTools = projBridge.allowed_tools;
                if (projBridge.enforcementMode) enforcementMode = projBridge.enforcementMode;
              } catch (e_proj) {}
            }

            await this.db.run(
              'INSERT INTO projects (id, name, path, description, allowed_tools, enforcement_mode) VALUES (?, ?, ?, ?, ?, ?)',
              [p.id, p.name, p.path, p.description || '', JSON.stringify(projectAllowedTools), enforcementMode]
            );
          }
          console.error(`[DB-Manager] Successfully seeded ${projects.length} projects.`);
        } catch (e) {
          console.error(`[DB-Manager] Failed to seed legacy projects: ${e.message}`);
        }
      }
    }
  }

  resolveConfiguredSecret(value, envName) {
    if (envName && process.env[envName]) {
      return process.env[envName];
    }
    if (typeof value !== 'string') return value;
    const envMatch = value.match(/^\$\{(?:ENV:)?([A-Z0-9_]+)\}$/i);
    if (envMatch) {
      return process.env[envMatch[1]] || null;
    }
    return value;
  }

  // --- Dynamic API Helpers ---

  async getUserByApiKey(apiKey) {
    await this.init();
    const row = await this.db.get('SELECT * FROM users WHERE apikey = ?', [apiKey]);
    if (!row) return null;
    return {
      ...row,
      allowed_tools: JSON.parse(row.allowed_tools)
    };
  }

  async getProjectById(projectId) {
    await this.init();
    const cleanId = (projectId || '').toLowerCase().trim();
    const row = await this.db.get('SELECT * FROM projects WHERE LOWER(id) = ?', [cleanId]);
    if (!row) return null;
    return {
      ...row,
      allowed_tools: JSON.parse(row.allowed_tools || '[]')
    };
  }

  async addOrUpdateUser(user) {
    await this.init();
    await this.db.run(
      `INSERT INTO users (id, username, apikey, role, allowed_tools)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         username = excluded.username,
         apikey = excluded.apikey,
         role = excluded.role,
         allowed_tools = excluded.allowed_tools`,
      [user.id, user.username, user.apikey, user.role, JSON.stringify(user.allowed_tools || [])]
    );
  }

  async addOrUpdateProject(project) {
    await this.init();
    await this.db.run(
      `INSERT INTO projects (id, name, path, description, allowed_tools, enforcement_mode)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         path = excluded.path,
         description = excluded.description,
         allowed_tools = excluded.allowed_tools,
         enforcement_mode = excluded.enforcement_mode`,
      [
        project.id,
        project.name,
        project.path,
        project.description || '',
        JSON.stringify(project.allowed_tools || []),
        project.enforcement_mode || 'STRICT'
      ]
    );
  }

  // --- Billing & Metering Helpers ---

  async getWalletBalance(userId) {
    await this.init();
    const row = await this.db.get('SELECT balance, currency FROM wallets WHERE user_id = ?', [userId]);
    if (!row) return { balance: 0, currency: 'CREDITS' };
    return row;
  }

  async deductBalance(userId, amount) {
    await this.init();
    await this.db.run('BEGIN TRANSACTION');
    try {
      await this.db.run(
        'UPDATE wallets SET balance = balance - ? WHERE user_id = ?',
        [amount, userId]
      );
      await this.db.run('COMMIT');
    } catch (e) {
      await this.db.run('ROLLBACK');
      throw e;
    }
  }

  async setWalletBalance(userId, amount, currency = 'CREDITS') {
    await this.init();
    await this.db.run(
      `INSERT INTO wallets (user_id, balance, currency)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         balance = excluded.balance,
         currency = excluded.currency`,
      [userId, amount, currency]
    );
  }

  async logUsage(userId, toolName, durationMs, cost) {
    await this.init();
    await this.db.run(
      'INSERT INTO usage_logs (user_id, tool_name, duration_ms, cost) VALUES (?, ?, ?, ?)',
      [userId, toolName, durationMs, cost]
    );
  }

  async getUsageLogs(userId, limit = 50) {
    await this.init();
    return await this.db.all(
      'SELECT * FROM usage_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );
  }

  async getAllUsersWithWallets() {
    await this.init();
    const rows = await this.db.all(`
      SELECT u.id, u.username, u.apikey, u.role, u.allowed_tools, 
             w.balance, w.currency
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
    `);
    return rows.map(r => ({
      ...r,
      allowed_tools: JSON.parse(r.allowed_tools || '[]')
    }));
  }

  async deleteUser(userId) {
    await this.init();
    await this.db.run('DELETE FROM usage_logs WHERE user_id = ?', [userId]);
    await this.db.run('DELETE FROM wallets WHERE user_id = ?', [userId]);
    await this.db.run('DELETE FROM users WHERE id = ?', [userId]);
  }

  async getBillingStats() {
    await this.init();
    const totalUsers = await this.db.get('SELECT COUNT(*) as count FROM users');
    const totalCredits = await this.db.get('SELECT SUM(balance) as total FROM wallets');
    const totalCalls = await this.db.get('SELECT COUNT(*) as count FROM usage_logs');
    const avgDuration = await this.db.get('SELECT AVG(duration_ms) as avg FROM usage_logs');
    const totalCost = await this.db.get('SELECT SUM(cost) as total FROM usage_logs');

    return {
      totalUsers: totalUsers.count || 0,
      totalCredits: Math.round((totalCredits.total || 0) * 100) / 100,
      totalCalls: totalCalls.count || 0,
      avgDuration: Math.round(avgDuration.avg || 0),
      totalCost: Math.round((totalCost.total || 0) * 100) / 100
    };
  }

  async getAllUsageLogs(limit = 100) {
    await this.init();
    return await this.db.all(`
      SELECT l.*, u.username 
      FROM usage_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC 
      LIMIT ?
    `, [limit]);
  }

  // --- Pricing & Admin Audit Helpers ---

  async getToolPrice(toolName) {
    await this.init();
    const row = await this.db.get('SELECT price FROM tool_prices WHERE tool_name = ?', [toolName]);
    return row ? row.price : 0.5; // default fallback
  }

  async setToolPrice(toolName, price) {
    await this.init();
    await this.db.run(
      `INSERT INTO tool_prices (tool_name, price)
       VALUES (?, ?)
       ON CONFLICT(tool_name) DO UPDATE SET price = excluded.price`,
      [toolName, parseFloat(price)]
    );
  }

  async getAllToolPrices() {
    await this.init();
    return await this.db.all('SELECT * FROM tool_prices ORDER BY tool_name ASC');
  }

  async logAdminAction(action, targetUser, details) {
    await this.init();
    await this.db.run(
      'INSERT INTO admin_audit_logs (action, target_user, details) VALUES (?, ?, ?)',
      [action, targetUser, details]
    );
  }

  async getAdminAuditLogs(limit = 100) {
    await this.init();
    return await this.db.all('SELECT * FROM admin_audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);
  }

  async generateVouchers(value, count) {
    await this.init();
    const generated = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < count; i++) {
      let part1 = '';
      let part2 = '';
      for (let j = 0; j < 4; j++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const code = `NEXUS-${part1}-${part2}`;
      await this.db.run(
        'INSERT INTO vouchers (code, value) VALUES (?, ?)',
        [code, parseFloat(value)]
      );
      generated.push({ code, value });
    }
    return generated;
  }

  async getAllVouchers() {
    await this.init();
    return await this.db.all(`
      SELECT v.*, u.username as redeemed_by_username 
      FROM vouchers v
      LEFT JOIN users u ON v.redeemed_by = u.id
      ORDER BY v.created_at DESC
    `);
  }

  async redeemVoucher(code, userId) {
    await this.init();
    
    // Check user
    const user = await this.db.get('SELECT username FROM users WHERE id = ?', [userId]);
    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    const voucher = await this.db.get('SELECT * FROM vouchers WHERE code = ?', [code]);
    if (!voucher) {
      return { success: false, error: 'كود الشحن هذا غير صحيح أو غير متوفر' };
    }

    if (voucher.is_redeemed === 1) {
      return { success: false, error: 'كود الشحن هذا تم استخدامه مسبقاً' };
    }

    // Process redemption
    await this.db.run(
      'UPDATE wallets SET balance = balance + ? WHERE user_id = ?',
      [voucher.value, userId]
    );

    await this.db.run(
      'UPDATE vouchers SET is_redeemed = 1, redeemed_by = ?, redeemed_at = CURRENT_TIMESTAMP WHERE code = ?',
      [userId, code]
    );

    await this.logAdminAction(
      'REDEEM_VOUCHER',
      user.username,
      `Redeemed voucher ${code} for ${voucher.value} CREDITS`
    );

    return {
      success: true,
      value: voucher.value,
      username: user.username
    };
  }
}

module.exports = new DatabaseManager();
