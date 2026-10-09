/**
 * Canonical site identity, shared by metadata, Open Graph, robots, and the
 * sitemap. Both URLs come from the build environment so a deployment sets
 * them once: PUBLIC_SITE_URL is the address Kast is served from, and
 * PUBLIC_SOURCE_URL the public repository of the code it runs. AGPL-3.0
 * requires offering that source to everyone who uses a modified copy over a
 * network, so a deployment should always set it.
 */
export const SITE = {
  name: "Kast",
  url: import.meta.env?.PUBLIC_SITE_URL || "http://localhost:4321",
  sourceUrl: import.meta.env?.PUBLIC_SOURCE_URL || "",
} as const;

/** The date the privacy policy last changed, shown on /privacy. */
export const PRIVACY_UPDATED = "2026-10-09";
