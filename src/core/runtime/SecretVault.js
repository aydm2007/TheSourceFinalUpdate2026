/**
 * @file SecretVault.js
 * @description الخزنة السيادية الموزعة لإدارة وتمويه الأسرار (Redaction).
 */

class SecretVault {
  constructor() {
    this.secrets = new Map();
    this.redactionRegex = null;
  }

  loadSecrets(envData = process.env, cliDirectives = {}) {
    // 1. Bypass Overrides
    if (cliDirectives.injectSecrets) {
      console.warn(
        `[VAULT] Overriding secrets using bypass script: ${cliDirectives.injectSecrets}`,
      );
      try {
        const path = require("path");
        const override = require(
          path.resolve(process.cwd(), cliDirectives.injectSecrets),
        );
        envData = {
          ...envData,
          ...(override.getMockSecrets ? override.getMockSecrets() : override),
        };
      } catch (err) {
        console.error(`[VAULT] Failed to load bypass script: ${err.message}`);
      }
    }

    const keysToRedact = [];
    for (const [key, value] of Object.entries(envData)) {
      if (
        (key.includes("KEY") ||
          key.includes("TOKEN") ||
          key.includes("SECRET")) &&
        value &&
        typeof value === "string"
      ) {
        this.secrets.set(key, value);
        // Only redact keys > 4 chars to avoid redacting common short strings accidentally
        if (value.length > 4) {
          keysToRedact.push(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // escape regex
        }
      }
    }

    if (keysToRedact.length > 0) {
      this.redactionRegex = new RegExp(`(${keysToRedact.join("|")})`, "g");
    }
  }

  get(key) {
    if (!this.secrets.has(key))
      throw new Error(`[VAULT FATAL] Missing secret: ${key}`);
    return this.secrets.get(key);
  }

  sanitizeLog(logString) {
    if (!this.redactionRegex || typeof logString !== "string") return logString;
    return logString.replace(
      this.redactionRegex,
      "[REDACTED_BY_SOVEREIGN_VAULT]",
    );
  }
}

module.exports = SecretVault;
