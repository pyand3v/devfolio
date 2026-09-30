import { describe, it, expect } from "vitest"
import { buildRssFeed, localePrefix, rssPath, rssTitle } from "@/lib/rss"

const siteUrl = "https://example.com"
const buildDate = new Date("2025-08-01T12:00:00Z")
const posts = [
  {
    slug: "newer",
    title: "Tips & <tricks>",
    summary: "A summary",
    publishedAt: "2025-06-01",
    updatedAt: "2025-07-15",
    tags: ["java", "design"],
  },
  {
    slug: "older",
    title: "Older",
    summary: "Old",
    publishedAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
]

const feed = (locale: "en" | "es" | "pt-br") =>
  buildRssFeed({ locale, siteUrl, title: "Site", description: "About", posts, buildDate })

describe("rss paths", () => {
  it("serves the default locale at the root and the others under their prefix", () => {
    expect([localePrefix("en"), localePrefix("es"), localePrefix("pt-br")]).toEqual([
      "",
      "/es",
      "/pt-br",
    ])
    expect([rssPath("en"), rssPath("es"), rssPath("pt-br")]).toEqual([
      "/rss.xml",
      "/es/rss.xml",
      "/pt-br/rss.xml",
    ])
  })
})

describe("rssTitle", () => {
  it("names the language of the translated feeds", () => {
    expect(rssTitle("Site", "en")).toBe("Site")
    expect(rssTitle("Site", "es")).toBe("Site (Español)")
    expect(rssTitle("Site", "pt-br")).toBe("Site (Português)")
  })
})

describe("buildRssFeed", () => {
  it("describes the channel in its locale", () => {
    const xml = feed("es")
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain("<title>Site</title>\n    <link>https://example.com/es</link>")
    expect(xml).toContain("<language>es</language>")
    expect(xml).toContain(`<lastBuildDate>${buildDate.toUTCString()}</lastBuildDate>`)
    expect(xml).toContain('<atom:link href="https://example.com/es/rss.xml" rel="self"')
  })

  it("links each post in the channel's locale", () => {
    expect(feed("pt-br")).toContain(
      "<link>https://example.com/pt-br/blog/newer</link>\n      <description>A summary</description>"
    )
    expect(feed("pt-br")).toContain(
      '<guid isPermaLink="true">https://example.com/pt-br/blog/older</guid>'
    )
    expect(feed("en")).toContain("<link>https://example.com/blog/newer</link>")
    expect(feed("en")).toContain("<link>https://example.com</link>")
  })

  it("escapes text, dates the posts and lists their tags", () => {
    const xml = feed("en")
    expect(xml).toContain("<title>Tips &amp; &lt;tricks&gt;</title>")
    expect(xml).toContain(`<pubDate>${new Date("2025-06-01").toUTCString()}</pubDate>`)
    expect(xml).toContain(`<lastBuildDate>${new Date("2025-07-15").toUTCString()}</lastBuildDate>`)
    expect(xml).toContain("<category>java</category>\n      <category>design</category>")
    expect(xml.match(/<category>/g)).toHaveLength(2)
  })

  it("renders an empty channel when there are no posts", () => {
    const xml = buildRssFeed({ locale: "es", siteUrl, title: "Site", description: "", posts: [] })
    expect(xml).not.toContain("<item>")
    expect(xml).toContain("</channel>")
  })
})
