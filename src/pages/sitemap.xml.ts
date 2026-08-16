import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { getAllBlogPosts, getAllProjects, getAllWorkItems } from "@/lib/content"
import { locales } from "@/lib/i18n"
import { escapeXml } from "@/lib/utils"

type SitemapEntry = {
  path: string
  lastmod?: string
  changefreq: "weekly" | "monthly"
  priority: number
}

const xmlEntry = ({ path, lastmod, changefreq, priority }: SitemapEntry) => {
  const loc = escapeXml(new URL(path, siteMetadata.siteUrl).toString())
  const modified = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""
  return `  <url>\n    <loc>${loc}</loc>${modified}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

export const GET: APIRoute = async () => {
  const [posts, workItems, projects, localizedPosts] = await Promise.all([
    getAllBlogPosts(),
    getAllWorkItems(),
    getAllProjects(),
    Promise.all(locales.filter(locale => locale !== "en").map(locale => getAllBlogPosts(locale))),
  ])
  const tags = [...new Set(posts.flatMap(post => post.tags ?? []))]
  const entries: SitemapEntry[] = [
    { path: "/", changefreq: "weekly", priority: 1 },
    { path: "/blog", changefreq: "weekly", priority: 0.9 },
    { path: "/work", changefreq: "monthly", priority: 0.8 },
    { path: "/projects", changefreq: "monthly", priority: 0.8 },
    ...posts.map(post => ({
      path: `/blog/${post.slug}`,
      lastmod: new Date(post.updatedAt).toISOString().slice(0, 10),
      changefreq: "monthly" as const,
      priority: 0.7,
    })),
    ...tags.map(tag => ({
      path: `/blog/tag/${encodeURIComponent(tag)}`,
      changefreq: "monthly" as const,
      priority: 0.5,
    })),
    ...localizedPosts.flatMap((postsForLocale, index) => {
      const locale = locales.filter(value => value !== "en")[index]
      return [
        { path: `/${locale}/blog`, changefreq: "weekly" as const, priority: 0.8 },
        ...postsForLocale.map(post => ({
          path: `/${locale}/blog/${post.slug}`,
          lastmod: new Date(post.updatedAt).toISOString().slice(0, 10),
          changefreq: "monthly" as const,
          priority: 0.7,
        })),
      ]
    }),
    ...workItems.map(item => ({
      path: `/work/${item.slug}`,
      changefreq: "monthly" as const,
      priority: 0.6,
    })),
    ...projects.map(project => ({
      path: `/projects/${project.slug}`,
      changefreq: "monthly" as const,
      priority: 0.6,
    })),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(xmlEntry).join("\n")}\n</urlset>`

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
