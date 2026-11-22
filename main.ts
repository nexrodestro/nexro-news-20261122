// nexro-news-20261122 v3 — stages the finished 22 Nov 2026 poster.
// The poster itself is painted once (dev/draw_poster_v3.py) and kept as
// entry.png; this program only checks that file and copies the exact
// same bytes to the output directory. No network, no randomness, no
// third-party imports, so two runs always write identical bytes.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const POSTER_PATH = join(ROOT, "entry.png");
const EXPECTED_EDGE = 1024;
const MAX_BYTES = 1024 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function loadPoster(): Buffer {
  if (!existsSync(POSTER_PATH)) {
    throw new Error(`poster missing: ${POSTER_PATH}`);
  }
  const bytes = readFileSync(POSTER_PATH);
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    throw new Error(`poster is ${bytes.length} bytes, must be 1..${MAX_BYTES}`);
  }
  return bytes;
}

function verifyPng(bytes: Buffer): void {
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (bytes[i] !== PNG_MAGIC[i]) {
      throw new Error("entry.png does not start with the PNG signature");
    }
  }
  if (bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error("first PNG chunk is not IHDR");
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== EXPECTED_EDGE || height !== EXPECTED_EDGE) {
    throw new Error(
      `poster is ${width}x${height}, expected ${EXPECTED_EDGE}x${EXPECTED_EDGE}`,
    );
  }
}

function posterDigest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function publish(bytes: Buffer): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, "entry.png");
  writeFileSync(dest, bytes);
  const staged = readFileSync(dest);
  if (!staged.equals(bytes)) {
    throw new Error(`staged copy differs from ${POSTER_PATH}`);
  }
  return dest;
}

function main(): void {
  const bytes = loadPoster();
  verifyPng(bytes);
  const dest = publish(bytes);
  console.log(
    `staged ${dest} (${bytes.length} bytes, sha256 ${posterDigest(bytes)})`,
  );
}

main();
