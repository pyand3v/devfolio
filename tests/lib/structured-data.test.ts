import { describe, it, expect } from "vitest"
import { footerConfig } from "@/data/portfolio"
import { siteMetadata } from "@/data/site"
import {
  blogPosting,
  homeGraph,
  languageTag,
  person,
  personId,
  websiteId,
} from "@/lib/structured-data"

const base = siteMetadata.siteUrl

describe("languageTag", () => {
  it("uppercases the region", () => {
    expect([languageTag("en"), languageTag("es"), languageTag("pt-br")]).toEqual([
      "en",
      "es",
      "pt-BR",
    ])
  })
})

describe("person", () => {
  it("describes the author with a stable @id and the footer profiles", () => {
    expect(person()).toMatchObject({
      "@type": "Person",
      "@id": `${base}/#person`,
      name: siteMetadata.author.name,
      url: base,
      jobTitle: "Product Engineer",
      sameAs: footerConfig.socialLinks.map(link => link.href),
    })
  })
})

describe("homeGraph", () => {
  it("has the Person and the WebSite they publish in every locale", () => {
    const graph = homeGraph()
    expect(graph["@context"]).toBe("https://schema.org")
    expect(graph["@graph"]).toEqual([
      person(),
      expect.objectContaining({
        "@type": "WebSite",
        "@id": websiteId,
        url: base,
        inLanguage: ["en", "es", "pt-BR"],
        publisher: { "@id": personId },
      }),
    ])
  })
})

describe("blogPosting", () => {
  const post = {
    title: "Concurrency in Java",
    summary: "Threads and locks",
    locale: "pt-br" as const,
    publishedAt: "2025-06-01",
    updatedAt: "2025-07-15",
    tags: ["java", "concurrency"],
    readingTime: 4,
  }
  const url = `${base}/blog/concurrency-in-java`

  it("describes the post at its URL", () => {
    expect(blogPosting(post, url)).toMatchObject({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      mainEntityOfPage: url,
      url,
      headline: "Concurrency in Java",
      description: "Threads and locks",
      image: `${url}/opengraph-image`,
    })
  })

  it("adds its dates, language, tags and reading time", () => {
    expect(blogPosting(post, url)).toMatchObject({
      datePublished: "2025-06-01",
      dateModified: "2025-07-15",
      inLanguage: "pt-BR",
      keywords: ["java", "concurrency"],
      timeRequired: "PT4M",
    })
  })

  it("credits the site's Person and links the WebSite", () => {
    const posting = blogPosting(post, url)
    const author = { "@type": "Person", "@id": personId, name: siteMetadata.author.name, url: base }
    expect(posting.author).toEqual(author)
    expect(posting.publisher).toEqual(author)
    expect(posting.isPartOf).toEqual({ "@id": websiteId })
  })
})
