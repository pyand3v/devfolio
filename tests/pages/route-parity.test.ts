import fs from "node:fs"
import path from "node:path"
import { describe, it, expect } from "vitest"

// The default locale's pages live at the root of src/pages and src/pages/[locale] mirrors them for the
// other locales (AGENTS.md: "update both trees"). This keeps the two trees in step.

const pagesDirectory = path.resolve("src/pages")
const localeDirectory = "[locale]"

// Root pages with no localized copy, and why. Keep this list short: a new page belongs in both trees.
const englishOnly: Record<string, string> = {
  "404.astro": "one not-found page serves every locale",
  "projects/[slug].astro":
    "project pages are English-only; the language switch and locale redirect go to /projects",
  "work/[slug].astro":
    "role pages are English-only; the language switch and locale redirect go to /work",
}

// Directories that aren't part of the public, localized site
const ignoredDirectories = new Set(["admin"])

function listPages(directory: string, prefix = ""): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      if (!prefix && (entry.name === localeDirectory || ignoredDirectories.has(entry.name))) {
        return []
      }
      return listPages(path.join(directory, entry.name), relative)
    }
    // Endpoints (.ts) such as opengraph-image, rss.xml or sitemap.xml aren't pages
    return entry.name.endsWith(".astro") ? [relative] : []
  })
}

const rootPages = listPages(pagesDirectory).sort()
const localizedPages = listPages(path.join(pagesDirectory, localeDirectory)).sort()

describe("route parity", () => {
  it("finds pages in both trees", () => {
    expect(rootPages).toContain("index.astro")
    expect(localizedPages).toContain("index.astro")
  })

  it("mirrors every root page under [locale]", () => {
    const missing = rootPages.filter(
      page => !(page in englishOnly) && !localizedPages.includes(page)
    )
    expect(missing, "add these under src/pages/[locale]/ or list them in englishOnly").toEqual([])
  })

  it("has a root page for every localized page", () => {
    const orphans = localizedPages.filter(page => !rootPages.includes(page))
    expect(orphans, "add these at the root of src/pages/").toEqual([])
  })

  it("only lists English-only pages that exist and have no localized copy", () => {
    for (const page of Object.keys(englishOnly)) {
      expect(rootPages, `${page} no longer exists`).toContain(page)
      expect(localizedPages, `${page} is localized now; drop it from englishOnly`).not.toContain(
        page
      )
    }
  })
})
