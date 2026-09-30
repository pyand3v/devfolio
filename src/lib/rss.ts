import { defaultLocale, localeOptions, type Locale } from "@/lib/i18n"
import { escapeXml } from "@/lib/utils"

export type RssPost = {
  slug: string
  title: string
  summary: string
  publishedAt: string
  updatedAt: string
  tags?: string[]
}

export type RssChannel = {
  locale: Locale
  siteUrl: string
  title: string
  description: string
  posts: RssPost[]
  /** Channel lastBuildDate; defaults to now */
  buildDate?: Date
}

/** The URL prefix for a locale: none for the default locale, `/es` for the others. */
export const localePrefix = (locale: Locale) => (locale === defaultLocale ? "" : `/${locale}`)

/** Where a locale's feed is served: `/rss.xml` for the default locale, `/es/rss.xml` for the others. */
export const rssPath = (locale: Locale) => `${localePrefix(locale)}/rss.xml`

/** A locale's feed title: the site title, plus the language for the translated feeds. */
export function rssTitle(siteTitle: string, locale: Locale): string {
  if (locale === defaultLocale) return siteTitle
  const language = localeOptions.find(option => option.code === locale)?.label.split(" (")[0]
  return `${siteTitle} (${language})`
}

/** Renders an RSS 2.0 feed of blog posts, linking each one to its page in the channel's locale. */
export function buildRssFeed({
  locale,
  siteUrl,
  title,
  description,
  posts,
  buildDate = new Date(),
}: RssChannel): string {
  const channelUrl = `${siteUrl}${localePrefix(locale)}`
  const items = posts
    .map(post => {
      const link = `${channelUrl}/blog/${post.slug}`
      const categories =
        post.tags?.map(tag => `      <category>${escapeXml(tag)}</category>`).join("\n") ?? ""
      return `    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${link}</link>\n      <description>${escapeXml(post.summary)}</description>\n      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>\n      <lastBuildDate>${new Date(post.updatedAt).toUTCString()}</lastBuildDate>\n      <guid isPermaLink="true">${link}</guid>${categories ? `\n${categories}` : ""}\n    </item>`
    })
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${escapeXml(title)}</title>\n    <link>${channelUrl}</link>\n    <description>${escapeXml(description)}</description>\n    <language>${locale}</language>\n    <lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>\n    <atom:link href="${siteUrl}${rssPath(locale)}" rel="self" type="application/rss+xml"/>\n${items}\n  </channel>\n</rss>`
}
