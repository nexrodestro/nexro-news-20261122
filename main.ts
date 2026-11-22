// Stager for the 22 November 2026 world-news poster.
//
// The poster image is painted ahead of time and stored beside this file as
// entry.png. This script does not paint anything: it proves the stored
// image is a well-formed 1024x1024 PNG inside the size cap, then copies
// its exact bytes into the grader's output directory and proves the copy
// matches byte for byte. Only the Node standard library is used, nothing
// is fetched from the network, and nothing random happens, so repeated
// runs always produce the same bytes.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const POSTER_FILE = "entry.png";
const POSTER_EDGE = 1024;
const POSTER_MAX_BYTES = 1024 * 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function posterPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, POSTER_FILE);
}

function readStoredPoster(): Buffer {
  let image: Buffer;
  try {
    image = readFileSync(posterPath());
  } catch {
    throw new Error(`cannot read ${POSTER_FILE} next to this script`);
  }
  if (image.length < 1 || image.length > POSTER_MAX_BYTES) {
    throw new Error(
      `${POSTER_FILE} is ${image.length} bytes, expected 1..${POSTER_MAX_BYTES}`,
    );
  }
  return image;
}

function checkPoster(image: Buffer): void {
  // A minimal valid PNG is 8 magic bytes + a 25-byte IHDR chunk + a
  // 12-byte IEND chunk; anything shorter cannot be a real poster.
  if (image.length < 45) {
    throw new Error(
      `${POSTER_FILE} is only ${image.length} bytes, too short to be a PNG`,
    );
  }
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (image[i] !== PNG_MAGIC[i]) {
      throw new Error(`${POSTER_FILE} does not begin with the PNG magic bytes`);
    }
  }
  const ihdrLength = image.readUInt32BE(8);
  if (ihdrLength !== 13) {
    throw new Error(
      `${POSTER_FILE} has an IHDR chunk of ${ihdrLength} bytes, expected 13`,
    );
  }
  const firstChunk = image.subarray(12, 16).toString("latin1");
  if (firstChunk !== "IHDR") {
    throw new Error(`${POSTER_FILE} does not start with an IHDR chunk`);
  }
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width !== POSTER_EDGE || height !== POSTER_EDGE) {
    throw new Error(
      `${POSTER_FILE} is ${width}x${height}, expected ${POSTER_EDGE}x${POSTER_EDGE}`,
    );
  }
  const trailer = image.subarray(image.length - 12);
  if (
    trailer.readUInt32BE(0) !== 0 ||
    trailer.subarray(4, 8).toString("latin1") !== "IEND"
  ) {
    throw new Error(`${POSTER_FILE} does not end with an IEND chunk`);
  }
}

function fingerprint(image: Buffer): string {
  return createHash("sha256").update(image).digest("hex");
}

function deliver(image: Buffer): string {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, POSTER_FILE);
  writeFileSync(target, image);
  const staged = readFileSync(target);
  if (!staged.equals(image)) {
    throw new Error(`staged file ${target} differs from ${POSTER_FILE}`);
  }
  return target;
}

function main(): void {
  const image = readStoredPoster();
  checkPoster(image);
  const target = deliver(image);
  console.log(
    `wrote ${target}: ${image.length} bytes, sha256 ${fingerprint(image)}`,
  );
}

main();
