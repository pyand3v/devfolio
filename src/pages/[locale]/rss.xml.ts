import type { APIRoute, GetStaticPaths } from "astro"
import { siteMetadata } from "@/data/site"
import { getAllBlogPosts } from "@/lib/content"
import { copy, locales, type Locale } from "@/lib/i18n"
import { buildRssFeed, rssTitle } from "@/lib/rss"

export const getStaticPaths = (() =>
  locales
    .filter(locale => locale !== "en")
    .map(locale => ({ params: { locale } }))) satisfies GetStaticPaths

// One feed per translated locale, with only the posts written in that language: the site shows the
// others in English, which a Spanish or Portuguese feed reader shouldn't get.
export const GET: APIRoute = async ({ params }) => {
  const locale = params.locale as Locale
  const posts = await getAllBlogPosts(locale, { featuredOnly: false })
  const xml = buildRssFeed({
    locale,
    siteUrl: siteMetadata.siteUrl,
    title: rssTitle(siteMetadata.title, locale),
    description: copy[locale].blog.description,
    posts: posts.filter(post => post.locale === locale),
  })
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
