/**
 * Generate PWA/favicon PNGs from an inline SVG of the slubstack panda badge.
 * Run once after svg changes: pnpm tsx scripts/generate-icons.ts
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

const OUT = path.join(process.cwd(), "public");

const BG = "#0d9488";
const PATCH = "#18181b";
const WHITE = "#ffffff";

function svg(size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">
  <rect width="120" height="120" rx="20" fill="${BG}"/>
  <ellipse cx="32" cy="34" rx="12" ry="12" fill="${PATCH}"/>
  <ellipse cx="88" cy="34" rx="12" ry="12" fill="${PATCH}"/>
  <ellipse cx="60" cy="66" rx="36" ry="32" fill="${WHITE}"/>
  <ellipse cx="45" cy="62" rx="9" ry="10" fill="${PATCH}" transform="rotate(-15 45 62)"/>
  <ellipse cx="75" cy="62" rx="9" ry="10" fill="${PATCH}" transform="rotate(15 75 62)"/>
  <circle cx="45" cy="64" r="2.4" fill="${WHITE}"/>
  <circle cx="75" cy="64" r="2.4" fill="${WHITE}"/>
  <ellipse cx="60" cy="76" rx="4" ry="3" fill="${PATCH}"/>
  <path d="M 54 84 Q 60 90 66 84" stroke="${PATCH}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
</svg>`;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const sizes = [192, 512, 180 /* apple-touch */];
  for (const size of sizes) {
    const name =
      size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
    await sharp(Buffer.from(svg(size)))
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, name));
    console.log("wrote", name);
  }
  // Favicon
  await sharp(Buffer.from(svg(64)))
    .resize(32, 32)
    .png()
    .toFile(path.join(OUT, "favicon.png"));
  await fs.writeFile(path.join(OUT, "icon.svg"), svg(120));
  console.log("wrote favicon.png and icon.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
