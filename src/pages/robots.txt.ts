import { A, pipe } from "@mobily/ts-belt";
import { localizePath, routing } from "@/i18n/routing";
import { SITE } from "@/lib/site";

export function GET() {
  const disallow = pipe(
    routing.locales,
    A.map((locale) => `Disallow: ${localizePath("/platform", locale)}`),
  );
  return new Response(
    A.join(
      [
        "User-Agent: *",
        "Allow: /",
        ...disallow,
        "",
        `Sitemap: ${new URL("/sitemap.xml", SITE.url).href}`,
        "",
      ],
      "\n",
    ),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
