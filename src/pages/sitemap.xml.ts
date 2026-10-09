import { A, pipe } from "@mobily/ts-belt";
import { localizePath, routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";

/** The public, indexable pages; the platform holds each visitor's own data. */
const PAGES = ["/", "/about", "/privacy"] as const;

function absolute(path: string): string {
  return new URL(path, SITE.url).href;
}

function urlEntry(page: string, locale: (typeof routing.locales)[number]) {
  const alternates = pipe(
    routing.locales,
    A.map(
      (alternate) =>
        `<xhtml:link rel="alternate" hreflang="${alternate}" href="${absolute(localizePath(page, alternate))}" />`,
    ),
    A.join("\n"),
  );
  return `<url>
<loc>${absolute(localizePath(page, locale))}</loc>
${alternates}
<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(localizePath(page, routing.defaultLocale))}" />
<changefreq>monthly</changefreq>
<priority>${page === "/" ? "1" : "0.5"}</priority>
</url>`;
}

export function GET() {
  const entries = pipe(
    PAGES,
    A.map((page) => A.map(routing.locales, (locale) => urlEntry(page, locale))),
    A.flat,
    A.join("\n"),
  );
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`,
    { headers: { "Content-Type": "application/xml" } },
  );
}
