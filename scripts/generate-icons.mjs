// Run with: node scripts/generate-icons.mjs
// Generates all required PWA icon sizes from the Zuplerno logo JPEG using sharp.

import sharp from "sharp";
import { mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

const SOURCE = path.join(__dirname, "..", "public", "zuplerno-logo.jpg");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of SIZES) {
  const outPath = path.join(OUT_DIR, `icon-${size}x${size}.png`);
  await sharp(SOURCE)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath}`);
}

// apple-touch-icon (180x180)
await sharp(SOURCE).resize(180, 180).png()
  .toFile(path.join(__dirname, "..", "public", "apple-touch-icon.png"));
console.log("✓ public/apple-touch-icon.png");

// favicon (32x32)
await sharp(SOURCE).resize(32, 32).png()
  .toFile(path.join(__dirname, "..", "public", "favicon-32x32.png"));
console.log("✓ public/favicon-32x32.png");

// favicon.ico equivalent as PNG (used by Next.js)
await sharp(SOURCE).resize(48, 48).png()
  .toFile(path.join(__dirname, "..", "public", "favicon.png"));
console.log("✓ public/favicon.png");

console.log("\nAll Zuplerno icons generated!");
