// Installs the page's Content Security Policy before anything else loads. A
// static site cannot send headers, and the allowed AI endpoints depend on the
// user's own settings, so the policy is built here and added as a <meta>
// element. It confines network access to this site and the AI providers: the
// two official APIs plus any https endpoint the user configured in Settings.
// Inline scripts stay allowed because Astro hydrates islands with them;
// 'wasm-unsafe-eval' lets the PDF renderer compile its WebAssembly.
(() => {
  const origins = [
    "https://api.anthropic.com",
    "https://generativelanguage.googleapis.com",
  ];
  try {
    const raw = localStorage.getItem("kast:ai-settings");
    const settings = raw ? JSON.parse(raw).state : null;
    const urls = settings?.baseUrls ? Object.values(settings.baseUrls) : [];
    for (const value of urls) {
      try {
        const url = new URL(String(value));
        if (url.protocol === "https:" && !origins.includes(url.origin)) {
          origins.push(url.origin);
        }
      } catch {
        // Not a URL: nothing to allow.
      }
    }
  } catch {
    // Storage blocked or unreadable: the official endpoints only.
  }
  const policy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' data: blob: ${origins.join(" ")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
  ].join("; ");
  const meta = document.createElement("meta");
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = policy;
  document.head.append(meta);
})();
