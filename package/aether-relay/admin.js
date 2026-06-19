#!/usr/bin/env node

const EphemeralKeyManager = require('../../core/security/ephemeral_keys');

const args = process.argv.slice(2);
const workspaceId = args[0] || 'default-client';

const token = EphemeralKeyManager.generateToken(workspaceId);

console.log(`\n\x1b[32m[SUCCESS] Sovereign Ephemeral Key Generated\x1b[0m\n`);
console.log(`Workspace ID : ${workspaceId}`);
console.log(`Token        : \x1b[36m${token}\x1b[0m`);
console.log(`Expires      : In 2 hours`);
console.log(`\nClient Command to run locally:`);
console.log(`\x1b[33mnpx aether-relay --token=${token}\x1b[0m\n`);
