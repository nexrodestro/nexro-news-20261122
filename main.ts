// nexro-news-20261122 v4 — stages the finished 22 Nov 2026 poster.
//
// v4 pairs v2's stories and wording (Poland lead, Mexico / Peru /
// Estonia / COP31 overtime, four-item ALSO TODAY strip) with v3's
// big-type craft (26px lead body, 25px panel body, 35-44px headlines).
// The poster is painted once (dev/draw_poster_v4.py) and kept as entry.png;
// this program only checks that file and stages the exact same bytes to
// the output directory. No network, no randomness, no third-party imports,
// so two runs always write identical bytes.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const POSTER = join(HERE, "entry.png");
const EDGE_PX = 1024;
const LIMIT = 1024 * 1024;
const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function fetchPoster(): Buffer {
  if (!existsSync(POSTER)) {
    throw new Error(`poster missing: ${POSTER}`);
  }
  const data = readFileSync(POSTER);
  if (data.length === 0 || data.length > LIMIT) {
    throw new Error(`poster is ${data.length} bytes, must be 1..${LIMIT}`);
  }
  return data;
}

function checkPngHead(data: Buffer): void {
  for (let i = 0; i < SIG.length; i++) {
    if (data[i] !== SIG[i]) {
      throw new Error("entry.png does not start with the PNG signature");
    }
  }
  if (data.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error("first PNG chunk is not IHDR");
  }
  const w = data.readUInt32BE(16);
  const h = data.readUInt32BE(20);
  if (w !== EDGE_PX || h !== EDGE_PX) {
    throw new Error(`poster is ${w}x${h}, expected ${EDGE_PX}x${EDGE_PX}`);
  }
}

function shaOf(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function stageOut(data: Buffer): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, "entry.png");
  writeFileSync(dest, data);
  const back = readFileSync(dest);
  if (!back.equals(data)) {
    throw new Error(`staged copy differs from ${POSTER}`);
  }
  return dest;
}

function run(): void {
  const data = fetchPoster();
  checkPngHead(data);
  const dest = stageOut(data);
  console.log(`staged ${dest} (${data.length} bytes, sha256 ${shaOf(data)})`);
}

run();
