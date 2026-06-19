const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DB_PATH = path.join(__dirname, '..', '..', '.nexus', 'var', 'telemetry', 'ephemeral_keys.json');

class EphemeralKeyManager {
    constructor() {
        this._ensureDb();
    }

    _ensureDb() {
        const dir = path.dirname(KEYS_DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(KEYS_DB_PATH)) {
            fs.writeFileSync(KEYS_DB_PATH, JSON.stringify({ keys: {} }, null, 2));
        }
    }

    _readDb() {
        try {
            return JSON.parse(fs.readFileSync(KEYS_DB_PATH, 'utf8'));
        } catch (err) {
            return { keys: {} };
        }
    }

    _writeDb(data) {
        fs.writeFileSync(KEYS_DB_PATH, JSON.stringify(data, null, 2));
    }

    /**
     * Generate a new single-use token that expires in 2 hours
     */
    generateToken(workspaceId = 'default') {
        const token = crypto.randomBytes(32).toString('hex');
        const db = this._readDb();
        
        db.keys[token] = {
            workspaceId,
            createdAt: Date.now(),
            expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
            used: false
        };
        
        this._writeDb(db);
        return token;
    }

    /**
     * Validate and consume a token
     */
    validateAndConsume(token) {
        if (!token) return false;
        
        const db = this._readDb();
        const keyData = db.keys[token];
        
        if (!keyData) return false;
        if (keyData.used) return false;
        if (Date.now() > keyData.expiresAt) return false;
        
        // Consume the token (Single-use)
        keyData.used = true;
        this._writeDb(db);
        
        return true;
    }
}

module.exports = new EphemeralKeyManager();
