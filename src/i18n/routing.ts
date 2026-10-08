import { A, pipe, S } from "@mobily/ts-belt";

export const routing = {
  locales: ["en", "lt", "ru"],
  defaultLocale: "en",
} as const;

/** localStorage key holding the visitor's explicit language choice. */
export const LOCALE_STORAGE_KEY = "kast:locale";

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: unknown): value is Locale {
  return A.includes(routing.locales, value as Locale);
}

const LOCALE_PREFIX = /^\/(lt|ru)(?=\/|$)/;

/**
 * Drops the locale prefix and any trailing slash: `/lt/platform/` becomes
 * `/platform`.
 */
export function stripLocale(pathname: string): string {
  return (
    pipe(
      pathname,
      S.replaceByRe(LOCALE_PREFIX, ""),
      S.replaceByRe(/\/+$/, ""),
    ) || "/"
  );
}

export function localeFromPath(pathname: string): Locale {
  const match = LOCALE_PREFIX.exec(pathname);
  if (match && isLocale(match[1])) return match[1];
  return routing.defaultLocale;
}

/** Prefixes a path for a locale. The default locale has no prefix. */
export function localizePath(href: string, locale: Locale): string {
  const path = stripLocale(href);
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** `getStaticPaths` entries for a page that exists in every locale. */
export function localeStaticPaths() {
  return A.map(routing.locales, (locale) => ({
    params: { lang: locale === routing.defaultLocale ? undefined : locale },
    props: { locale },
  }));
}

/**
 * Saves an explicit language choice. The head script reads it on the next
 * visit to an unprefixed page and sends the visitor to their language.
 */
export function rememberLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only.
  }
}
