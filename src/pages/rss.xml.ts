import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { getAllBlogPosts } from "@/lib/content"
import { escapeXml } from "@/lib/utils"

export const GET: APIRoute = async () => {
  const posts = await getAllBlogPosts()
  const feedUrl = `${siteMetadata.siteUrl}/rss.xml`
  const items = posts
    .map(post => {
      const link = `${siteMetadata.siteUrl}/blog/${post.slug}`
      const categories =
        post.tags?.map(tag => `      <category>${escapeXml(tag)}</category>`).join("\n") ?? ""
      return `    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${link}</link>\n      <description>${escapeXml(post.summary)}</description>\n      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>\n      <lastBuildDate>${new Date(post.updatedAt).toUTCString()}</lastBuildDate>\n      <guid isPermaLink="true">${link}</guid>${categories ? `\n${categories}` : ""}\n    </item>`
    })
    .join("\n")
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${escapeXml(siteMetadata.title)}</title>\n    <link>${siteMetadata.siteUrl}</link>\n    <description>${escapeXml(siteMetadata.description)}</description>\n    <language>en</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>\n${items}\n  </channel>\n</rss>`
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
