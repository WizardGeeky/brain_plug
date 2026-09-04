import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * AES-256-GCM Encryption Service
 * Securely encrypts and decrypts application data, passwords, and secrets.
 */
export class EncryptionService {
  private static getKey(): Buffer {
    const rawKey =
      process.env.AES_ENCRYPTION_KEY ||
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    return crypto.scryptSync(rawKey, "brain_plug_aes_salt_2026", 32);
  }

  /**
   * Encrypt plaintext using AES-256-GCM into iv:authTag:encrypted
   */
  public static encrypt(plainText: string): string {
    if (!plainText) return "";
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = this.getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt AES-256-GCM payload formatted as iv:authTag:encrypted
   */
  public static decrypt(cipherTextWithMeta: string): string {
    if (!cipherTextWithMeta) return "";
    try {
      const parts = cipherTextWithMeta.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid cipher format");
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const key = this.getKey();

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (err) {
      console.error("AES Decryption failed:", err);
      return "";
    }
  }

  /**
   * Encrypt a password using AES-256-GCM
   */
  public static encryptPassword(plainPassword: string): string {
    return this.encrypt(plainPassword);
  }

  /**
   * Verify a password against an AES-256-GCM encrypted password string
   */
  public static verifyPassword(plainPassword: string, encryptedPassword: string): boolean {
    const decrypted = this.decrypt(encryptedPassword);
    if (!decrypted) return false;
    // Constant time comparison
    return crypto.timingSafeEqual(
      Buffer.from(plainPassword, "utf8"),
      Buffer.from(decrypted, "utf8")
    );
  }

  /**
   * SHA-256 Hash for API keys and OTP tokens
   */
  public static hashSha256(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Generate a cryptographically secure 6-digit OTP
   */
  public static generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Generate a random API key with standard prefix
   */
  public static generateApiKey(prefix = "ak_live"): {
    rawKey: string;
    keyPrefix: string;
    keyHash: string;
  } {
    const randomSecret = crypto.randomBytes(24).toString("hex");
    const rawKey = `${prefix}_${randomSecret}`;
    const keyPrefix = rawKey.substring(0, 12) + "...";
    const keyHash = this.hashSha256(rawKey);
    return { rawKey, keyPrefix, keyHash };
  }
}
