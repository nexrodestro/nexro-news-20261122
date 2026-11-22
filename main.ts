// nexro-news-20261122 — delivers the finished 22 Nov 2026 poster.
// The poster is painted once (dev/draw_poster.py) and kept as entry.png;
// this program only verifies that file and copies the same bytes to
// the output directory. No network, no randomness, no dependencies,
// so two runs always write identical bytes.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const POSTER = join(HERE, "entry.png");
const EDGE = 1024;
const CAP = 1024 * 1024;
const MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function posterBytes(): Buffer {
  const bytes = readFileSync(POSTER);
  if (bytes.length > CAP) {
    throw new Error(`poster is ${bytes.length} bytes, over the 1 MiB cap`);
  }
  return bytes;
}

function pngOk(bytes: Buffer): void {
  for (let i = 0; i < MAGIC.length; i++) {
    if (bytes[i] !== MAGIC[i]) {
      throw new Error("entry.png is not a PNG file");
    }
  }
  if (bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error("first PNG chunk is not IHDR");
  }
  const w = bytes.readUInt32BE(16);
  const h = bytes.readUInt32BE(20);
  if (w !== EDGE || h !== EDGE) {
    throw new Error(`poster is ${w}x${h}, expected ${EDGE}x${EDGE}`);
  }
}

function stage(bytes: Buffer): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, "entry.png");
  writeFileSync(dest, bytes);
  return dest;
}

const bytes = posterBytes();
pngOk(bytes);
const dest = stage(bytes);
console.log(`staged ${dest} (${bytes.length} bytes)`);
