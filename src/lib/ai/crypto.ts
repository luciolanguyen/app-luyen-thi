import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Mã hoá API key trước khi lưu database.
 *
 * Khoá mã hoá lấy từ biến môi trường AI_ENCRYPTION_KEY và KHÔNG bao giờ vào
 * database. Nghĩa là kẻ lấy được bản sao database vẫn không đọc được key của
 * bạn — họ cần thêm biến môi trường trên máy chủ.
 *
 * AES-256-GCM có xác thực gắn kèm (auth tag), nên bản mã bị sửa một byte là
 * giải mã thất bại chứ không trả về rác.
 */

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.AI_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "Thiếu AI_ENCRYPTION_KEY (tối thiểu 16 ký tự) trong biến môi trường. " +
        "Sinh một chuỗi ngẫu nhiên rồi khai vào .env.local."
    );
  }
  // Băm về đúng 32 byte để chấp nhận secret dài ngắn tuỳ ý
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv.tag.ciphertext — tất cả base64url để lưu dạng text an toàn
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    enc.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Bản mã API key không đúng định dạng.");
  }
  const decipher = createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(ivB64, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Bốn ký tự cuối để admin nhận ra key nào, không đủ để dùng lại. */
export function keyHint(plain: string): string {
  const tail = plain.trim().slice(-4);
  return tail.length === 4 ? tail : "????";
}

export function isEncryptionConfigured(): boolean {
  return Boolean(
    process.env.AI_ENCRYPTION_KEY && process.env.AI_ENCRYPTION_KEY.length >= 16
  );
}
