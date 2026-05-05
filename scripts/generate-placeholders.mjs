// One-shot placeholder PNG generator.
// Run with `npm run gen:assets`. Safe to re-run; existing files are overwritten.
import { PNG } from "pngjs";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ASSETS = join(ROOT, "public", "assets");

/** Parse a #rrggbb color string to {r,g,b}. */
function parseHex(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

/**
 * Create a PNG buffer of the requested size with a flat fill color, optional
 * border, and an optional secondary "head" rectangle near the top so character
 * silhouettes are at least vaguely person-shaped.
 */
function makePng({
  width,
  height,
  fill,
  border = "#000000",
  borderWidth = 2,
  head,
  stripes,
}) {
  const png = new PNG({ width, height });
  const fillC = parseHex(fill);
  const borderC = border ? parseHex(border) : null;
  const headC = head?.color ? parseHex(head.color) : null;
  const stripeC = stripes?.color ? parseHex(stripes.color) : null;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      let c = fillC;
      let a = 255;

      if (
        stripeC &&
        stripes.every &&
        Math.floor(y / stripes.every) % 2 === 1
      ) {
        c = stripeC;
      }

      if (
        head &&
        headC &&
        x >= head.x &&
        x < head.x + head.w &&
        y >= head.y &&
        y < head.y + head.h
      ) {
        c = headC;
      }

      if (
        borderC &&
        (x < borderWidth ||
          y < borderWidth ||
          x >= width - borderWidth ||
          y >= height - borderWidth)
      ) {
        c = borderC;
      }

      png.data[idx] = c.r;
      png.data[idx + 1] = c.g;
      png.data[idx + 2] = c.b;
      png.data[idx + 3] = a;
    }
  }

  return PNG.sync.write(png);
}

async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

async function writeAsset(relPath, png) {
  const full = join(ASSETS, relPath);
  await ensureDir(dirname(full));
  await writeFile(full, png);
  console.log("wrote", relPath);
}

// ---- Characters (32x64-ish standing silhouettes) ---------------------------
const characterSpecs = [
  {
    file: "characters/mom.png",
    body: "#e94560",
    head: "#f4d6a8",
  },
  {
    file: "characters/parent1.png",
    body: "#3a86ff",
    head: "#f4d6a8",
  },
  {
    file: "characters/parent2.png",
    body: "#06d6a0",
    head: "#c68642",
  },
  {
    file: "characters/parent3.png",
    body: "#ffbe0b",
    head: "#8d5524",
  },
  {
    file: "characters/zeno.png",
    body: "#9b5de5",
    head: "#f4d6a8",
    width: 28,
    height: 48,
  },
  {
    file: "characters/teacher.png",
    body: "#fb5607",
    head: "#f4d6a8",
  },
];

for (const spec of characterSpecs) {
  const w = spec.width ?? 32;
  const h = spec.height ?? 64;
  const headW = Math.floor(w * 0.6);
  const headH = Math.floor(h * 0.3);
  const headX = Math.floor((w - headW) / 2);
  const headY = 2;
  const png = makePng({
    width: w,
    height: h,
    fill: spec.body,
    border: "#000000",
    borderWidth: 2,
    head: { x: headX, y: headY, w: headW, h: headH, color: spec.head },
  });
  await writeAsset(spec.file, png);
}

// ---- Car (long horizontal rectangle) ---------------------------------------
await writeAsset(
  "characters/car.png",
  makePng({
    width: 160,
    height: 64,
    fill: "#ef233c",
    border: "#000000",
    borderWidth: 3,
    stripes: { color: "#1a1a2e", every: 32 },
  }),
);

// ---- Portraits (256x256, big "face" rectangle) -----------------------------
const portraitSpecs = [
  { file: "portraits/mom_portrait.png", body: "#e94560", face: "#f4d6a8" },
  { file: "portraits/dad_portrait.png", body: "#3a86ff", face: "#f4d6a8" },
  { file: "portraits/teacher_portrait.png", body: "#fb5607", face: "#f4d6a8" },
  { file: "portraits/zeno_portrait.png", body: "#9b5de5", face: "#f4d6a8" },
];

for (const spec of portraitSpecs) {
  const png = makePng({
    width: 256,
    height: 256,
    fill: spec.body,
    border: "#000000",
    borderWidth: 4,
    head: { x: 64, y: 48, w: 128, h: 128, color: spec.face },
  });
  await writeAsset(spec.file, png);
}

// ---- Backgrounds (1280x720) ------------------------------------------------
const backgroundSpecs = [
  { file: "backgrounds/street.png", fill: "#3a3a55", stripe: "#4a4a6a" },
  {
    file: "backgrounds/school_interior.png",
    fill: "#f4a261",
    stripe: "#e9c46a",
  },
  { file: "backgrounds/classroom.png", fill: "#a8dadc", stripe: "#cde7e9" },
  { file: "backgrounds/splash.png", fill: "#ffafcc", stripe: "#ffc8dd" },
];

for (const spec of backgroundSpecs) {
  const png = makePng({
    width: 1280,
    height: 720,
    fill: spec.fill,
    border: null,
    stripes: { color: spec.stripe, every: 60 },
  });
  await writeAsset(spec.file, png);
}

console.log("done.");
