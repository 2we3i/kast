// Kast's service worker. scripts/build-service-worker.ts copies this file to
// dist/sw.js and fills in the version and the precache list. It never talks
// to any server but this site, and it never caches requests to AI providers.
const VERSION = "__KAST_VERSION__";
const PRECACHE = ["__KAST_PRECACHE__"];
const SHELL = `kast-shell-${VERSION}`;
const RUNTIME = "kast-runtime";

/** Each entry is [cache key, file URL]; one failed file never blocks the rest. */
async function precache() {
  const cache = await caches.open(SHELL);
  await Promise.all(
    PRECACHE.map(async ([key, source]) => {
      try {
        const response = await fetch(source, { cache: "no-cache" });
        if (!response.ok) return;
        // Hosts often redirect /page.html to /page. A redirected response
        // cannot answer a navigation, so store a plain copy of its body.
        const stored = response.redirected
          ? new Response(await response.blob(), { headers: response.headers })
          : response;
        await cache.put(key, stored);
      } catch {
        // Fetched again at runtime when online.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("kast-shell-") && key !== SHELL)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "kast:skip-waiting") self.skipWaiting();
});

/** Page paths as precached: no .html, and directories with a slash. */
function pageKeys(url) {
  const path = url.pathname.replace(/\.html$/, "");
  if (path.endsWith("/")) return [path, path.slice(0, -1) || "/"];
  return [path, `${path}/`];
}

async function fromShell(keys) {
  const cache = await caches.open(SHELL);
  for (const key of keys) {
    const hit = await cache.match(key, { ignoreSearch: true });
    if (hit) return hit;
  }
  return undefined;
}

/** Pages: the network when it answers, the precached copy when offline. */
async function page(request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (response.ok) return response;
    return (await fromShell(pageKeys(url))) ?? response;
  } catch {
    return (
      (await fromShell(pageKeys(url))) ??
      (await fromShell(["/platform/", "/"])) ??
      Response.error()
    );
  }
}

/** Fingerprinted assets and fonts never change under one URL. */
async function cacheFirst(request) {
  const cached =
    (await caches.match(request, { ignoreSearch: true })) ?? undefined;
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(page(request));
    return;
  }
  if (
    url.pathname.startsWith("/_astro/") ||
    url.pathname.startsWith("/fonts/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(
    caches
      .match(request, { ignoreSearch: true })
      .then((cached) => cached ?? fetch(request)),
  );
});
