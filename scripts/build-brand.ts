/**
 * Builds every brand asset in public/ from the Kast mark: the SVG favicon, the
 * PNG favicons, the Apple touch icon, the maskable PWA icons, and a
 * multi-size favicon.ico. Re-run after any change to the mark:
 *   pnpm brand
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const PUBLIC = join(process.cwd(), "public");

export const BRAND = {
  indigo: "#1E1B4B",
  amber: "#F5B942",
  white: "#FFFFFF",
} as const;

/** The glyph alone, drawn in a 64×64 box: a white stem and leg, an amber arm. */
const GLYPH = `
  <rect x="16" y="14" width="9" height="36" rx="4.5" fill="${BRAND.white}"/>
  <path d="M28 33 L43 50" stroke="${BRAND.white}" stroke-width="9" stroke-linecap="round" fill="none"/>
  <path d="M28 33 L45 15" stroke="${BRAND.amber}" stroke-width="9" stroke-linecap="round" fill="none"/>`;

/** The rounded tile used for favicons and in-app marks. */
export const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Kast"><title>Kast</title><rect width="64" height="64" rx="14" fill="${BRAND.indigo}"/>${GLYPH}</svg>`;

/**
 * Full-bleed square for platforms that apply their own mask. The glyph
 * shrinks into the central 80% safe zone that maskable icons require.
 */
const FULL_BLEED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" fill="${BRAND.indigo}"/><g transform="translate(32 32) scale(0.72) translate(-32.75 -32.5)">${GLYPH}</g></svg>`;

/** Mark plus the "Kast" wordmark; `ink` colors the letters. */
export function wordmarkSvg(ink: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64" width="200" height="64" role="img" aria-label="Kast"><title>Kast</title><rect width="64" height="64" rx="14" fill="${BRAND.indigo}"/>${GLYPH}<text x="80" y="45" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="-0.5" fill="${ink}">Kast</text></svg>`;
}

async function png(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: Math.max(72, size * 4) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** An ICO file holding PNG-encoded images, which every current browser reads. */
function ico(images: ReadonlyArray<{ size: number; data: Buffer }>): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const directory = Buffer.alloc(16 * images.length);
  let offset = 6 + directory.length;
  images.forEach((image, index) => {
    const at = index * 16;
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, at);
    directory.writeUInt8(image.size >= 256 ? 0 : image.size, at + 1);
    directory.writeUInt8(0, at + 2);
    directory.writeUInt8(0, at + 3);
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(image.data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += image.data.length;
  });
  return Buffer.concat([header, directory, ...images.map((i) => i.data)]);
}

async function main() {
  writeFileSync(join(PUBLIC, "favicon.svg"), MARK_SVG);
  writeFileSync(
    join(PUBLIC, "brand", "kast-logo.svg"),
    wordmarkSvg(BRAND.indigo),
  );
  writeFileSync(
    join(PUBLIC, "brand", "kast-logo-dark.svg"),
    wordmarkSvg(BRAND.white),
  );
  writeFileSync(join(PUBLIC, "brand", "kast-mark.svg"), MARK_SVG);

  const outputs: ReadonlyArray<[string, string, number]> = [
    ["favicon-16x16.png", MARK_SVG, 16],
    ["favicon-32x32.png", MARK_SVG, 32],
    ["favicon-192x192.png", MARK_SVG, 192],
    ["favicon-512x512.png", MARK_SVG, 512],
    ["apple-touch-icon.png", FULL_BLEED_SVG, 180],
    ["maskable-icon-192x192.png", FULL_BLEED_SVG, 192],
    ["maskable-icon-512x512.png", FULL_BLEED_SVG, 512],
  ];
  for (const [name, svg, size] of outputs) {
    writeFileSync(join(PUBLIC, name), await png(svg, size));
  }

  const icoImages = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      data: await png(MARK_SVG, size),
    })),
  );
  writeFileSync(join(PUBLIC, "favicon.ico"), ico(icoImages));
  console.log("brand assets written to public/");
}

if (process.argv[1]?.endsWith("build-brand.ts")) {
  void main();
}
