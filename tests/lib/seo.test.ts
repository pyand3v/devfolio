import { describe, it, expect } from "vitest"
import {
  hreflang,
  languageAlternates,
  localizePath,
  logicalPath,
  trimTrailingSlash,
} from "@/lib/seo"

const site = "https://example.com"

describe("path helpers", () => {
  it("trims trailing slashes but keeps the root", () => {
    expect(trimTrailingSlash("/es/blog/")).toBe("/es/blog")
    expect(trimTrailingSlash("/blog")).toBe("/blog")
    expect(trimTrailingSlash("/")).toBe("/")
  })

  it("drops the locale segment to get the path translations share", () => {
    expect(logicalPath("/es/blog/post/")).toBe("/blog/post")
    expect(logicalPath("/pt-br")).toBe("/")
    expect(logicalPath("/byo/course")).toBe("/byo/course")
  })

  it("prefixes every locale but the default", () => {
    expect(localizePath("/blog", "en")).toBe("/blog")
    expect(localizePath("/blog", "es")).toBe("/es/blog")
    expect(localizePath("/", "pt-br")).toBe("/pt-br")
    expect(localizePath("/", "en")).toBe("/")
  })

  it("writes hreflang values as BCP 47 tags", () => {
    expect([hreflang("en"), hreflang("es"), hreflang("pt-br")]).toEqual(["en", "es", "pt-BR"])
  })
})

describe("languageAlternates", () => {
  it("links every translation and marks the default locale as x-default", () => {
    expect(languageAlternates("/es/blog/post", ["en", "es", "pt-br"], site)).toEqual([
      { hreflang: "en", href: "https://example.com/blog/post" },
      { hreflang: "es", href: "https://example.com/es/blog/post" },
      { hreflang: "pt-BR", href: "https://example.com/pt-br/blog/post" },
      { hreflang: "x-default", href: "https://example.com/blog/post" },
    ])
  })

  it("only links the locales the page exists in, in locale order", () => {
    expect(languageAlternates("/blog/post", ["es", "en"], site).map(a => a.hreflang)).toEqual([
      "en",
      "es",
      "x-default",
    ])
  })

  it("handles the home page", () => {
    expect(languageAlternates("/pt-br", ["en", "pt-br"], site).map(a => a.href)).toEqual([
      "https://example.com/",
      "https://example.com/pt-br",
      "https://example.com/",
    ])
  })

  it("has no x-default without the default locale, and nothing for a single locale", () => {
    expect(languageAlternates("/es/x", ["es", "pt-br"], site).map(a => a.hreflang)).toEqual([
      "es",
      "pt-BR",
    ])
    expect(languageAlternates("/work/acme", ["en"], site)).toEqual([])
    expect(languageAlternates("/blog/tag/java", [], site)).toEqual([])
  })
})
