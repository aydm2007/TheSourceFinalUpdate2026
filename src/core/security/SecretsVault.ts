import * as crypto from "crypto";

class SecretsVault {
  private secrets = new Map<string, string>();
  private encryptionKey: Buffer;

  constructor() {
    // Generate a random encryption key or use env variable
    const keyEnv = process.env.SECRETS_VAULT_KEY;
    if (keyEnv) {
      this.encryptionKey = crypto.createHash("sha256").update(keyEnv).digest();
    } else {
      this.encryptionKey = crypto.randomBytes(32);
    }
  }

  set(key: string, value: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.encryptionKey, iv);
    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");
    this.secrets.set(key, JSON.stringify({ iv: iv.toString("hex"), data: encrypted }));
  }

  get(key: string): string | null {
    const raw = this.secrets.get(key);
    if (!raw) {
      // Fall back to process environment
      return process.env[key] || null;
    }
    try {
      const { iv, data } = JSON.parse(raw);
      const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        this.encryptionKey,
        Buffer.from(iv, "hex")
      );
      let decrypted = decipher.update(data, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      return null;
    }
  }

  clear() {
    this.secrets.clear();
  }
}

export default new SecretsVault();
