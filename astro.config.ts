import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// Interface fonts are fetched once at build time and self-hosted with the
// site, so visitors never contact a font CDN. Every family carries Latin
// Extended (Lithuanian) and Cyrillic (Russian) next to basic Latin.
const SUBSETS: [string, ...string[]] = [
  "latin",
  "latin-ext",
  "cyrillic",
  "cyrillic-ext",
];

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "http://localhost:4321",
  // Pages land where their source sits: platform/editor.astro becomes
  // platform/editor.html, and lt/404.astro the localized lt/404.html.
  build: { format: "preserve" },
  trailingSlash: "ignore",
  server: { port: 4321 },
  devToolbar: { enabled: false },
  integrations: [
    react({
      babel: { plugins: [["babel-plugin-react-compiler", { target: "19" }]] },
    }),
  ],
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-sans",
      weights: ["100 900"],
      styles: ["normal"],
      subsets: SUBSETS,
    },
    {
      provider: fontProviders.google(),
      name: "Geist",
      cssVariable: "--font-geist-sans",
      weights: ["100 900"],
      styles: ["normal"],
      subsets: ["latin", "latin-ext", "cyrillic"],
    },
    {
      provider: fontProviders.google(),
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      weights: ["100 900"],
      styles: ["normal"],
      subsets: ["latin", "latin-ext", "cyrillic"],
    },
    {
      provider: fontProviders.google(),
      name: "Manrope",
      cssVariable: "--font-display",
      weights: ["200 800"],
      styles: ["normal"],
      subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    // nextstepjs ships extensionless ESM imports, which Node cannot load
    // during prerender. Bundling it lets Vite resolve them.
    ssr: { noExternal: ["nextstepjs"] },
    environments: {
      prerender: { resolve: { noExternal: ["nextstepjs"] } },
    },
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
          warn(warning);
        },
      },
    },
  },
});
