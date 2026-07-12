import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "../public/icons");

const iconFiles = ["icon-192.png", "icon-512.png", "apple-touch-icon.png"];

function isNeutralWhite(r, g, b) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return r >= 250 && g >= 250 && b >= 250 && spread <= 5;
}

function removeCornerWhite({ data, info }) {
  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  function index(x, y) {
    return y * width + x;
  }

  function tryEnqueue(x, y) {
    const i = index(x, y);
    if (visited[i]) {
      return;
    }

    const offset = i * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    if (!isNeutralWhite(r, g, b)) {
      return;
    }

    visited[i] = 1;
    queue.push(i);
  }

  for (let x = 0; x < width; x += 1) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const i = queue.pop();
    if (i === undefined) {
      continue;
    }

    const offset = i * channels;
    data[offset + 3] = 0;

    const x = i % width;
    const y = (i - x) / width;

    if (x > 0) {
      tryEnqueue(x - 1, y);
    }
    if (x < width - 1) {
      tryEnqueue(x + 1, y);
    }
    if (y > 0) {
      tryEnqueue(x, y - 1);
    }
    if (y < height - 1) {
      tryEnqueue(x, y + 1);
    }
  }

  return data;
}

for (const file of iconFiles) {
  const inputPath = path.join(iconsDir, file);
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const output = removeCornerWhite({ data: Buffer.from(data), info });

  await sharp(output, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png()
    .toFile(inputPath);

  console.log(`Processed ${file}`);
}
