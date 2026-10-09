// Registers the offline service worker and reports its state to the app.
// "kast:sw-ready" fires once the first install finishes; "kast:sw-update"
// fires when a newer version waits, and window.__kastWaitingWorker holds it.
// The browser's install prompt is kept on window.__kastInstallPrompt for the
// Settings page.
(() => {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__kastInstallPrompt = event;
    window.dispatchEvent(new CustomEvent("kast:install-available"));
  });
  if (!("serviceWorker" in navigator)) return;
  const notifyUpdate = (worker) => {
    window.__kastWaitingWorker = worker;
    window.dispatchEvent(new CustomEvent("kast:sw-update"));
  };
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          notifyUpdate(registration.waiting);
        }
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state !== "installed") return;
            if (navigator.serviceWorker.controller) notifyUpdate(worker);
            else window.dispatchEvent(new CustomEvent("kast:sw-ready"));
          });
        });
      })
      .catch(() => {
        // Offline support is an extra; the app works without it.
      });
  });
})();
