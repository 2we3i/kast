/**
 * Writes dist/sw.js after `astro build`. The worker precaches the app shell
 * (every page, script, stylesheet, interface font, icon, and the PDF
 * renderer's WebAssembly) so Kast opens and works offline once visited.
 * Résumé fonts are many and large, so they are cached the first time the
 * preview loads them instead of up front.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const DIST = join(process.cwd(), "dist");

/** Skipped from precache: social images and lazily cached résumé fonts. */
const SKIP = [/^og\//, /^fonts\//, /^sw\.js$/, /\.map$/, /^robots\.txt$/];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/**
 * [cache key, file URL]. Pages are fetched by their file name, which every
 * static host serves, and stored under the clean URL visitors navigate to.
 */
function entryFor(file: string): [string, string] {
  const path = relative(DIST, file).split(sep).join("/");
  const source = `/${path}`;
  if (path === "index.html") return ["/", source];
  if (path.endsWith("/index.html")) return [`/${path.slice(0, -10)}`, source];
  if (path.endsWith(".html")) return [`/${path.slice(0, -5)}`, source];
  return [source, source];
}

const files = walk(DIST).filter(
  (file) =>
    !SKIP.some((pattern) =>
      pattern.test(relative(DIST, file).split(sep).join("/")),
    ),
);
const hash = createHash("sha256");
for (const file of files) hash.update(readFileSync(file));
const version = hash.digest("hex").slice(0, 12);
const entries = files.map(entryFor).sort((a, b) => a[0].localeCompare(b[0]));

const template = readFileSync(
  join(process.cwd(), "src/scripts/service-worker.js"),
  "utf8",
);
writeFileSync(
  join(DIST, "sw.js"),
  template
    .replace('"__KAST_VERSION__"', JSON.stringify(version))
    .replace('["__KAST_PRECACHE__"]', JSON.stringify(entries)),
);
const size = files.reduce((total, file) => total + statSync(file).size, 0);
console.log(
  `sw.js: ${entries.length} files precached (${(size / 1024 / 1024).toFixed(1)} MB), version ${version}`,
);
