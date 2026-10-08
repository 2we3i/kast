// Runs inline in <head>, before the first paint, so the static HTML shows the
// saved preferences instead of the defaults. Keep it small and dependency free.
// The storage keys match src/lib/storage/keys.ts.
(() => {
  const root = document.documentElement;

  const read = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  // Settings saved under the product's previous name move to the kast: prefix
  // once, before anything reads them. IndexedDB moves in src/lib/storage.
  try {
    if (!localStorage.getItem("kast:storage-migrated")) {
      const renames = [
        ["theme", "kast:theme"],
        ["lanjut:sidebar-state", "kast:sidebar-state"],
        ["lanjut:tour-seen", "kast:tour-seen"],
        ["lanjut:changelog-seen", "kast:changelog-seen"],
      ];
      for (const [from, to] of renames) {
        const value = localStorage.getItem(from);
        if (value !== null && localStorage.getItem(to) === null) {
          localStorage.setItem(to, value);
        }
      }
      localStorage.setItem("kast:storage-migrated", "1");
    }
  } catch {
    // Storage blocked: nothing to move.
  }

  // Language: an unprefixed page sends a visitor to their saved language, or on
  // a first visit to the browser's preferred one among those Kast speaks.
  const path = location.pathname;
  if (!/^\/(lt|ru)(\/|$)/.test(path)) {
    const saved = read("kast:locale");
    const preferred =
      saved ??
      (navigator.languages || [navigator.language])
        .map((tag) => String(tag).slice(0, 2).toLowerCase())
        .find((code) => code === "en" || code === "lt" || code === "ru");
    if (preferred === "lt" || preferred === "ru") {
      const rest = path === "/" ? "" : path;
      location.replace(
        `/${preferred}${rest}${location.search}${location.hash}`,
      );
      return;
    }
  }

  // Theme: a stored choice wins, otherwise follow the system.
  const theme = read("kast:theme") ?? "system";
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && systemDark);
  root.classList.remove("light", "dark");
  root.classList.add(dark ? "dark" : "light");
  root.style.colorScheme = dark ? "dark" : "light";

  // Sidebar: globals.css collapses it from this attribute until React hydrates.
  const sidebar = read("kast:sidebar-state");
  root.dataset.sidebar = sidebar === "collapsed" ? "collapsed" : "expanded";
})();
