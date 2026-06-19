/**
 * AstMutexLockManager
 * 
 * Ensures semantic parallel locking (Spatial & Semantic Isolation).
 * Prevents two swarms in different work-trees from modifying the same
 * sensitive function block concurrently.
 */
const fs = require('fs');
const path = require('path');

class AstMutexLockManager {
    constructor() {
        this.lockFilePath = path.join(process.cwd(), '.nexus', 'var', 'locks', 'ast_mutex.json');
        this.initializeLockFile();
    }

    initializeLockFile() {
        const dir = path.dirname(this.lockFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.lockFilePath)) {
            fs.writeFileSync(this.lockFilePath, JSON.stringify({}, null, 2));
        }
    }

    _readLocks() {
        try {
            const data = fs.readFileSync(this.lockFilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    _writeLocks(locks) {
        fs.writeFileSync(this.lockFilePath, JSON.stringify(locks, null, 2));
    }

    /**
     * @param {string} agentId - Swarm Agent ID
     * @param {string} workTreeId - The isolated Git Work-Tree
     * @param {string} filePath - Target file path
     * @param {string} semanticBlock - AST Node (e.g., 'calculateTax')
     * @returns {boolean} True if lock acquired, False if locked by another
     */
    acquireLock(agentId, workTreeId, filePath, semanticBlock) {
        const locks = this._readLocks();
        const lockKey = `${filePath}::${semanticBlock}`;

        if (locks[lockKey]) {
            if (locks[lockKey].agentId === agentId) {
                // Agent already holds the lock
                return true;
            }
            console.warn(`[AST-MUTEX] DENIED: ${lockKey} is currently locked by ${locks[lockKey].agentId} in ${locks[lockKey].workTreeId}`);
            return false;
        }

        locks[lockKey] = {
            agentId,
            workTreeId,
            timestamp: new Date().toISOString()
        };

        this._writeLocks(locks);
        console.log(`[AST-MUTEX] ACQUIRED: ${lockKey} by ${agentId}`);
        return true;
    }

    releaseLock(agentId, filePath, semanticBlock) {
        const locks = this._readLocks();
        const lockKey = `${filePath}::${semanticBlock}`;

        if (locks[lockKey] && locks[lockKey].agentId === agentId) {
            delete locks[lockKey];
            this._writeLocks(locks);
            console.log(`[AST-MUTEX] RELEASED: ${lockKey} by ${agentId}`);
            return true;
        }
        return false;
    }

    isLocked(filePath, semanticBlock) {
        const locks = this._readLocks();
        const lockKey = `${filePath}::${semanticBlock}`;
        return !!locks[lockKey];
    }
}

module.exports = new AstMutexLockManager();
