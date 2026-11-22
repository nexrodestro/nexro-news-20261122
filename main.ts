import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ENTRY_NAME = "entry.png";
const MAX_BYTES = 1048576;
const MIN_BYTES = 10000;
const WANT_W = 1024;
const WANT_H = 1024;

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function repoRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

function readEntry(): Buffer {
  const p = join(repoRoot(), ENTRY_NAME);
  if (!existsSync(p)) throw new Error(`missing ${ENTRY_NAME} in repo root`);
  return readFileSync(p);
}

function checkPng(buf: Buffer): { w: number; h: number } {
  if (buf.length < 33) throw new Error("poster too short to be a PNG");
  if (!buf.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error("poster is not a PNG (bad signature)");
  }
  const ihdrLen = buf.readUInt32BE(8);
  const ihdrType = buf.toString("ascii", 12, 16);
  if (ihdrType !== "IHDR" || ihdrLen !== 13) {
    throw new Error("poster has no valid IHDR chunk");
  }
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (w !== WANT_W || h !== WANT_H) {
    throw new Error(`poster is ${w}x${h}, want ${WANT_W}x${WANT_H}`);
  }
  if (buf.length > MAX_BYTES) {
    throw new Error(`poster is ${buf.length} bytes, over the 1 MiB cap`);
  }
  if (buf.length < MIN_BYTES) {
    throw new Error(`poster is ${buf.length} bytes, too small to be a poster`);
  }
  const tail = buf.subarray(buf.length - 12);
  if (tail.readUInt32BE(0) !== 0 || tail.toString("ascii", 4, 8) !== "IEND") {
    throw new Error("poster has no IEND trailer");
  }
  return { w, h };
}

function sha256hex(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function stageCopy(buf: Buffer, outDir: string): string {
  mkdirSync(outDir, { recursive: true });
  const dest = join(outDir, ENTRY_NAME);
  writeFileSync(dest, buf);
  const back = readFileSync(dest);
  if (sha256hex(back) !== sha256hex(buf)) {
    throw new Error("staged copy differs from the poster");
  }
  return dest;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const buf = readEntry();
  const { w, h } = checkPng(buf);
  const sha = sha256hex(buf);
  const dest = stageCopy(buf, outDir);
  console.log(`poster ${w}x${h} ${buf.length} bytes sha256 ${sha}`);
  console.log(`staged ${dest} (round-trip verified)`);
}

main();
