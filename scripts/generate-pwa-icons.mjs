import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconSvg = path.join(root, "public/icons/icon.svg");
const outDir = path.join(root, "public/icons");

const sizes = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

const svg = await fs.readFile(iconSvg);

await fs.mkdir(outDir, { recursive: true });

for (const { name, size } of sizes) {
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, name));
  console.log(`Wrote public/icons/${name}`);
}
