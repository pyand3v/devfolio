import { describe, it, expect } from "vitest"
import {
  copy,
  getLocaleFromPathname,
  getLocaleSwitchPath,
  getLocalizedPath,
  localeOptions,
  locales,
} from "@/lib/i18n"

const keyPaths = (value: unknown, prefix = ""): string[] =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value).flatMap(([key, child]) =>
        keyPaths(child, prefix ? `${prefix}.${key}` : key)
      )
    : [prefix]

describe("locales", () => {
  it("has one option per locale, in the same order", () => {
    expect(localeOptions.map(option => option.code)).toEqual([...locales])
  })

  it("defines copy for every locale", () => {
    expect(Object.keys(copy).sort()).toEqual([...locales].sort())
  })

  it.each(locales.filter(locale => locale !== "en"))(
    "has the same copy keys in %s as in en",
    locale => {
      expect(keyPaths(copy[locale]).sort()).toEqual(keyPaths(copy.en).sort())
    }
  )
})

describe("getLocaleFromPathname", () => {
  it("returns the locale from the first segment", () => {
    expect(getLocaleFromPathname("/es/blog")).toBe("es")
    expect(getLocaleFromPathname("/pt-br")).toBe("pt-br")
    expect(getLocaleFromPathname("/pt-br/byo/project/")).toBe("pt-br")
  })

  it("falls back to en for unprefixed or unknown paths", () => {
    expect(getLocaleFromPathname("/")).toBe("en")
    expect(getLocaleFromPathname("")).toBe("en")
    expect(getLocaleFromPathname("/blog/es")).toBe("en")
    expect(getLocaleFromPathname("/fr/blog")).toBe("en")
    expect(getLocaleFromPathname("/en/blog")).toBe("en")
  })
})

// Links are locale-neutral; src/scripts/site.ts adds the preferred locale prefix on click.
describe("getLocalizedPath", () => {
  it("returns a locale-neutral path for every locale", () => {
    for (const locale of locales) expect(getLocalizedPath("/blog", locale)).toBe("/blog")
  })

  it("strips an existing locale prefix", () => {
    expect(getLocalizedPath("/es/blog/post-1", "es")).toBe("/blog/post-1")
    expect(getLocalizedPath("/pt-br", "pt-br")).toBe("/")
  })

  it("adds a leading slash and removes a trailing one", () => {
    expect(getLocalizedPath("blog/tag/astro/", "en")).toBe("/blog/tag/astro")
  })

  it("returns the root for empty paths", () => {
    expect(getLocalizedPath("", "en")).toBe("/")
    expect(getLocalizedPath("/", "es")).toBe("/")
  })
})

describe("getLocaleSwitchPath", () => {
  it("keeps the full path for blog and BYO pages", () => {
    expect(getLocaleSwitchPath("/es/blog/post-1", "en")).toBe("/blog/post-1")
    expect(getLocaleSwitchPath("/byo/project/lesson-01", "es")).toBe("/byo/project/lesson-01")
  })

  it("stays on the search page", () => {
    expect(getLocaleSwitchPath("/es/search", "pt-br")).toBe("/search")
  })

  it("goes to the section index for work and projects detail pages", () => {
    expect(getLocaleSwitchPath("/work/acme", "es")).toBe("/work")
    expect(getLocaleSwitchPath("/pt-br/projects/app", "en")).toBe("/projects")
  })

  it("goes home for any other page", () => {
    expect(getLocaleSwitchPath("/es", "en")).toBe("/")
    expect(getLocaleSwitchPath("/", "pt-br")).toBe("/")
    expect(getLocaleSwitchPath("/unknown/page", "es")).toBe("/")
  })
})
