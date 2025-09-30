import assert from "assert";
import crypto from "crypto";

// ===== Base32 Crockford (không lẫn O/0, I/1) =====
const ALPH = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function base32Encode(buf: Buffer): string {
    let bits = 0,
        value = 0,
        output = "";
    for (const b of buf) {
        value = (value << 8) | b;
        bits += 8;
        while (bits >= 5) {
            output += ALPH[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) output += ALPH[(value << (5 - bits)) & 31];
    return output;
}
function base32Decode(str: string): Buffer {
    let bits = 0,
        value = 0;
    const bytes: number[] = [];
    for (const ch of str.replace(/-/g, "").toUpperCase()) {
        const idx = ALPH.indexOf(ch);
        if (idx < 0) throw new Error("Invalid base32 char");
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(bytes);
}

// ===== Checksum đơn giản (mod 97) để bắt lỗi gõ sai =====
function checksum97(s: string): string {
    let n = 0;
    for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 97;
    return String(n).padStart(2, "0");
}

// ===== Key derivation từ APP_SECRET (HKDF-SHA256) =====
const APP_ID = "KUDAMINE"; // đổi nếu muốn tách domain app
function getSecret(): Buffer {
    const secret = process.env.APP_SECRET ?? "";
    assert(secret && secret.length >= 16, "APP_SECRET is required (>=16 chars)");
    return Buffer.from(secret, "utf8");
}
function deriveAesKey(): Buffer {
    // HKDF: key = HKDF(secret, salt=APP_ID, info="LOGIN_CODE", len=32)
    const ikm = getSecret();
    const salt = Buffer.from(APP_ID, "utf8");
    const info = Buffer.from("LOGIN_CODE", "utf8");
    const prk = crypto.createHmac("sha256", salt).update(ikm).digest();
    const t1 = crypto
        .createHmac("sha256", prk)
        .update(Buffer.concat([info, Buffer.from([1])]))
        .digest();
    return t1.subarray(0, 32); // 32 bytes cho AES-256
}

// ===== Mã hoá/giải mã username bằng AES-GCM =====
// Code format: BASE32( IV(12) + CIPHERTEXT + TAG(16) ) -> cắt 12 ký tự + checksum 2 -> nhóm ####-####-####-CC
const GROUPS = [4, 4, 4];
const CODE_LEN = 12; // số ký tự chính (không tính checksum)

function packPretty(b32: string): string {
    const base = b32.slice(0, CODE_LEN);
    const cc = checksum97(base);
    const parts: string[] = [];
    let p = 0;
    for (const g of GROUPS) {
        parts.push(base.slice(p, p + g));
        p += g;
    }
    return `${parts.join("-")}-${cc}`;
}
function unpackPretty(code: string): { base: string; cc: string } {
    const raw = code.replace(/-/g, "").toUpperCase();
    if (raw.length !== CODE_LEN + 2) throw new Error("Invalid code length");
    return { base: raw.slice(0, CODE_LEN), cc: raw.slice(CODE_LEN) };
}

function encodeUsernameToCode(username: string): string {
    const key = deriveAesKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const normalized = username.trim().toLowerCase();
    const ciphertext = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const packed = Buffer.concat([iv, ciphertext, tag]);
    const b32full = base32Encode(packed);
    return packPretty(b32full);
}

function decodeCodeToUsername(code: string): string {
    const { base, cc } = unpackPretty(code);
    if (checksum97(base) !== cc) throw new Error("Checksum mismatch");
    const buf = base32Decode(base);
    throw new Error("Cannot decrypt: not enough data in short code.");
}

export function signUsernameToken(username: string): string {
    const key = deriveAesKey();
    const normalized = username.trim().toLowerCase();
    const payload = Buffer.from(normalized, "utf8");
    const sig = crypto.createHmac("sha256", key).update(payload).digest(); // 32 bytes
    const packed = Buffer.concat([payload, sig]); // [username][hmac]
    const b32 = base32Encode(packed);
    // format nhóm 5-5-5-5-5-5-CC (~32+2) cho username ngắn; với username dài, b32 cũng dài hơn.
    const cc = checksum97(b32);
    // Nhóm theo từng 5 ký tự cho dễ gõ
    const parts = b32.match(/.{1,5}/g) ?? [b32];
    return `${parts.join("-")}-${cc}`;
}

export function verifyAndExtractUsername(code: string): string {
    const raw = code.replace(/-/g, "").toUpperCase();
    if (raw.length < 34) throw new Error("Code too short");
    const body = raw.slice(0, -2);
    const cc = raw.slice(-2);
    if (checksum97(body) !== cc) throw new Error("Checksum mismatch");
    const buf = base32Decode(body);
    if (buf.length < 33) throw new Error("Invalid token");
    // tách payload & sig: sig 32 bytes cuối
    const sig = buf.subarray(buf.length - 32);
    const payload = buf.subarray(0, buf.length - 32);
    const key = deriveAesKey();
    const expect = crypto.createHmac("sha256", key).update(payload).digest();
    if (!crypto.timingSafeEqual(sig, expect)) throw new Error("Signature mismatch");
    return Buffer.from(payload).toString("utf8"); // username (normalized)
}
