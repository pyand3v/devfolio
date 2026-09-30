import { defaultLocale, getLocalizedPath, locales, type Locale } from "@/lib/i18n"

/** One form per page for canonical URLs: `/es/blog/` becomes `/es/blog`; `/` stays. */
export const trimTrailingSlash = (path: string) => path.replace(/(.)\/+$/, "$1")

/** The path without its locale segment, shared by a page's translations: `/es/blog/x` → `/blog/x`. */
export const logicalPath = (path: string) =>
  getLocalizedPath(trimTrailingSlash(path), defaultLocale)

/** A logical path in a locale: the default locale has no prefix, the others do (`/es/blog/x`). */
export const localizePath = (path: string, locale: Locale) =>
  locale === defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`

/** The hreflang value for a locale, a BCP 47 tag: `pt-br` → `pt-BR`. */
export const hreflang = (locale: Locale) =>
  locale.replace(/-([a-z]+)$/, (_, region: string) => `-${region.toUpperCase()}`)

export type Alternate = { hreflang: string; href: string }

/**
 * The `<link rel="alternate" hreflang>` entries for a page that exists in `translations`: one per locale,
 * plus `x-default` for the default locale's version. A page in a single locale has none.
 */
export function languageAlternates(
  path: string,
  translations: readonly Locale[],
  siteUrl: string
): Alternate[] {
  const available = locales.filter(locale => translations.includes(locale))
  if (available.length < 2) return []
  const href = (locale: Locale) => new URL(localizePath(logicalPath(path), locale), siteUrl).href
  const alternates = available.map(locale => ({ hreflang: hreflang(locale), href: href(locale) }))
  return available.includes(defaultLocale)
    ? [...alternates, { hreflang: "x-default", href: href(defaultLocale) }]
    : alternates
}
