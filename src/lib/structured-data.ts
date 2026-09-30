import type { BlogPosting, Graph, Person, WebSite, WithContext } from "schema-dts"
import { footerConfig } from "@/data/portfolio"
import { siteMetadata } from "@/data/site"
import { locales, type Locale } from "@/lib/i18n"

// JSON-LD for BaseLayout's jsonLd prop. The Person and WebSite get stable @ids, so blog posts can point
// at the same author and site.

export const personId = `${siteMetadata.siteUrl}/#person`
export const websiteId = `${siteMetadata.siteUrl}/#website`

/** BCP 47 language tag for a locale, as schema.org's inLanguage expects: `pt-br` becomes `pt-BR`. */
export const languageTag = (locale: Locale) =>
  locale.replace(/-([a-z]+)$/, (_, region: string) => `-${region.toUpperCase()}`)

/** The site's author, with the profiles in the footer as sameAs. */
export function person(): Person {
  return {
    "@type": "Person",
    "@id": personId,
    name: siteMetadata.author.name,
    url: siteMetadata.siteUrl,
    description: siteMetadata.description,
    jobTitle: "Product Engineer",
    sameAs: footerConfig.socialLinks.map(link => link.href),
  }
}

/** The author as a reference that still names them, for pages that don't include the full Person. */
const author = (): Person => ({
  "@type": "Person",
  "@id": personId,
  name: siteMetadata.author.name,
  url: siteMetadata.siteUrl,
})

/** The home page graph: the Person and the WebSite they publish, in every locale. */
export function homeGraph(): Graph {
  const website: WebSite = {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteMetadata.siteUrl,
    name: siteMetadata.title,
    description: siteMetadata.description,
    inLanguage: locales.map(languageTag),
    publisher: { "@id": personId },
  }
  return { "@context": "https://schema.org", "@graph": [person(), website] }
}

export type BlogPostingInput = {
  title: string
  summary: string
  locale: Locale
  publishedAt: string
  updatedAt: string
  tags?: string[]
  readingTime: number
}

/**
 * A blog post. `url` is the page's canonical URL; `post.locale` is the language the text is in, which is
 * English on a translated page without a translation.
 */
export function blogPosting(post: BlogPostingInput, url: string): WithContext<BlogPosting> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: post.title,
    description: post.summary,
    image: `${url}/opengraph-image`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: languageTag(post.locale),
    keywords: post.tags,
    timeRequired: `PT${post.readingTime}M`,
    author: author(),
    publisher: author(),
    isPartOf: { "@id": websiteId },
  }
}
