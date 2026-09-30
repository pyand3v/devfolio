import type { APIContext, APIRoute } from "astro"
import { beforeEach, describe, it, expect, vi } from "vitest"

type Entry = { id: string; data: Record<string, unknown>; body?: string }

const collections = vi.hoisted(() => ({}) as Record<string, Entry[]>)

vi.mock("astro:content", () => ({
  getCollection: async (name: string, filter?: (entry: Entry) => boolean) => {
    const entries = collections[name] ?? []
    return filter ? entries.filter(filter) : entries
  },
}))

const { siteMetadata } = await import("@/data/site")
const rss = await import("@/pages/rss.xml")
const sitemap = await import("@/pages/sitemap.xml")
const llms = await import("@/pages/llms.txt")
const robots = await import("@/pages/robots.txt")

const base = siteMetadata.siteUrl

async function render(endpoint: { GET: APIRoute }) {
  const response = await endpoint.GET({} as APIContext)
  return { response, text: await response.text() }
}

const blogPost = (slug: string, locale: string, title: string, extra = {}) => ({
  id: `${locale}/${slug}`,
  data: { slug, locale, title, summary: `${title} summary`, ...extra },
  body: "word ".repeat(10),
})

beforeEach(() => {
  collections.blog = [
    blogPost("older", "en", "Older & wiser", {
      publishedAt: "2024-01-01",
      tags: ["Java", "Design"],
    }),
    blogPost("newer", "en", "Newer", {
      publishedAt: "2025-06-01",
      updatedAt: "2025-07-15",
      featured: true,
      tags: ["java"],
    }),
    blogPost("newer", "es", "Más nuevo", { tags: ["java"] }),
    blogPost("newer", "pt-br", "Mais novo", { tags: ["java"] }),
  ]
  collections.work = [
    {
      id: "acme",
      data: {
        slug: "acme",
        company: "Acme",
        title: "Engineer",
        start: "Jan 2022",
        end: "Present",
        description: "Built things.",
      },
    },
  ]
  collections.projects = [
    {
      id: "rocket",
      data: {
        slug: "rocket",
        title: "Rocket",
        startDate: "2023-05",
        endDate: "2023-09",
        techStack: ["Rust", "Go"],
        description: "A fast thing.",
      },
    },
  ]
})

describe("rss.xml", () => {
  it("is served as XML", async () => {
    const { response, text } = await render(rss)
    expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8")
    expect(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(text).toContain(`<atom:link href="${base}/rss.xml" rel="self"`)
  })

  it("lists every English post once, newest first, including ones that aren't featured", async () => {
    const { text } = await render(rss)
    const links = [...text.matchAll(/<item>[\s\S]*?<link>(.*?)<\/link>/g)].map(match => match[1])
    expect(links).toEqual([`${base}/blog/newer`, `${base}/blog/older`])
  })

  it("uses the English titles, escaped, and the posts' dates and tags", async () => {
    const { text } = await render(rss)
    expect(text).toContain("<title>Older &amp; wiser</title>")
    expect(text).not.toContain("Más nuevo")
    expect(text).toContain(`<pubDate>${new Date("2025-06-01").toUTCString()}</pubDate>`)
    expect(text).toContain(`<lastBuildDate>${new Date("2025-07-15").toUTCString()}</lastBuildDate>`)
    expect(text).toContain("<category>java</category>\n      <category>design</category>")
    expect(text).toContain("<language>en</language>")
  })
})

describe("sitemap.xml", () => {
  const locations = (text: string) =>
    [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1].replace(base, ""))

  it("is served as XML", async () => {
    const { response, text } = await render(sitemap)
    expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8")
    expect(text).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  })

  it("lists the list pages, every post, tag, role and project once", async () => {
    const { text } = await render(sitemap)
    expect(locations(text)).toEqual([
      "/",
      "/blog",
      "/work",
      "/projects",
      "/blog/newer",
      "/blog/older",
      "/blog/tag/java",
      "/blog/tag/design",
      "/work/acme",
      "/projects/rocket",
    ])
  })

  it("dates posts by their last update", async () => {
    const { text } = await render(sitemap)
    expect(text).toContain(`<loc>${base}/blog/newer</loc>\n    <lastmod>2025-07-15</lastmod>`)
    expect(text).toContain(`<loc>${base}/blog/older</loc>\n    <lastmod>2024-01-01</lastmod>`)
  })
})

describe("llms.txt", () => {
  it("is served as plain text", async () => {
    const { response, text } = await render(llms)
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8")
    expect(text.startsWith(`# ${siteMetadata.title}\n\n> ${siteMetadata.description}`)).toBe(true)
  })

  it("links every post, project and role", async () => {
    const { text } = await render(llms)
    expect(text).toContain(`- [Newer](${base}/blog/newer): Newer summary`)
    expect(text).toContain(`- [Older & wiser](${base}/blog/older): Older & wiser summary`)
    expect(text).toContain(
      `- [Rocket](${base}/projects/rocket) (2023-05 – 2023-09, Rust, Go): A fast thing.`
    )
    expect(text).toContain(
      `- [Acme](${base}/work/acme): Engineer, Jan 2022 – Present. Built things.`
    )
    expect(text).toContain(`- [RSS Feed](${base}/rss.xml)`)
  })
})

describe("robots.txt", () => {
  it("allows crawling, hides internal paths and points to the sitemap", async () => {
    const { response, text } = await render(robots)
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8")
    expect(text).toContain("User-Agent: *\nAllow: /\n")
    for (const path of ["/api/", "/_astro/", "/admin/"]) {
      expect(text).toContain(`Disallow: ${path}\n`)
    }
    expect(text).toContain(`Sitemap: ${base}/sitemap.xml`)
  })
})
