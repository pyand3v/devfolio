import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { getAllBlogPosts } from "@/lib/content"
import { buildRssFeed } from "@/lib/rss"

export const GET: APIRoute = async () => {
  const posts = await getAllBlogPosts("en", { featuredOnly: false })
  const xml = buildRssFeed({
    locale: "en",
    siteUrl: siteMetadata.siteUrl,
    title: siteMetadata.title,
    description: siteMetadata.description,
    posts,
  })
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
