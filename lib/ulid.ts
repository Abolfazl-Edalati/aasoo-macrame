import crypto from "node:crypto";

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN = ENCODING.length;

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier).
 * 26 characters: 10 chars timestamp (48 bits) + 16 chars randomness (80 bits).
 */
export function generateUlid(seedTime: number = Date.now()): string {
  // 1. Encode 48-bit timestamp into 10 Crockford Base32 characters
  let timeStr = "";
  let time = seedTime;
  for (let i = 9; i >= 0; i--) {
    const mod = time % ENCODING_LEN;
    timeStr = ENCODING[mod] + timeStr;
    time = Math.floor(time / ENCODING_LEN);
  }

  // 2. Encode 80-bit randomness (10 bytes) into 16 Crockford Base32 characters
  const randBytes = crypto.randomBytes(10);
  let randStr = "";
  for (let i = 0; i < 16; i++) {
    // Pick 5 bits per character from the 80 bits
    const bitOffset = i * 5;
    const byteOffset = Math.floor(bitOffset / 8);
    const bitInByte = bitOffset % 8;

    let chunk = (randBytes[byteOffset] << 8) | (randBytes[byteOffset + 1] ?? 0);
    if (byteOffset + 2 < randBytes.length) {
      chunk = (chunk << 8) | randBytes[byteOffset + 2];
    }
    const val = (chunk >> (16 - bitInByte - 5)) & 0x1f;
    randStr += ENCODING[val];
  }

  return timeStr + randStr;
}
