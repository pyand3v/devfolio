import { beforeEach, describe, it, expect, vi } from "vitest"

type Entry = { id: string; data: Record<string, unknown>; body?: string }

const collections = vi.hoisted(() => ({}) as Record<string, Entry[]>)

vi.mock("astro:content", () => ({
  getCollection: async (name: string, filter?: (entry: Entry) => boolean) => {
    const entries = collections[name] ?? []
    return filter ? entries.filter(filter) : entries
  },
}))

const {
  getAllBlogPosts,
  getAllByoProjects,
  getAllProjects,
  getAllWorkItems,
  getBlogPost,
  getByoContent,
  getByoProject,
} = await import("@/lib/content")

const blogPost = (translationKey: string, locale: string, title: string, tags?: string[]) => ({
  id: `${locale}/${translationKey}`,
  data: { translationKey, locale, title, summary: `${title} summary`, tags },
  body: "word ".repeat(150),
})

const blogMetadata = (
  id: string,
  publishedAt: string,
  { featured = true, availableLanguages = ["en"], fallbackLanguage = "en" } = {}
) => ({
  id,
  data: {
    slug: id,
    publishedAt,
    updatedAt: publishedAt,
    featured,
    availableLanguages,
    fallbackLanguage,
  },
})

const byoEntry = (
  locale: string,
  project: string,
  type: string,
  slug: string,
  extra: Record<string, unknown> = {}
) => ({
  id: `${locale}/${project}/${slug}`,
  data: { locale, type, slug, project, title: slug, order: 0, ...extra },
})

beforeEach(() => {
  for (const key of Object.keys(collections)) delete collections[key]
})

describe("getAllBlogPosts", () => {
  beforeEach(() => {
    collections.blog = [
      blogPost("older", "en", "Older", ["Astro", "TypeScript"]),
      blogPost("newer", "en", "Newer"),
      blogPost("newer", "es", "Más nuevo"),
      blogPost("draft", "en", "Draft"),
    ]
    collections.blogMetadata = [
      blogMetadata("older", "2024-01-01"),
      blogMetadata("newer", "2025-06-01", { availableLanguages: ["en", "es"] }),
      blogMetadata("draft", "2025-09-01", { featured: false }),
    ]
  })

  it("returns featured posts, newest first", async () => {
    const posts = await getAllBlogPosts()
    expect(posts.map(post => post.slug)).toEqual(["newer", "older"])
  })

  it("includes non-featured posts when featuredOnly is false", async () => {
    const posts = await getAllBlogPosts("en", { featuredOnly: false })
    expect(posts.map(post => post.slug)).toEqual(["draft", "newer", "older"])
  })

  it("uses the requested locale when it is available", async () => {
    const [newer] = await getAllBlogPosts("es")
    expect(newer.title).toBe("Más nuevo")
    expect(newer.locale).toBe("es")
  })

  it("falls back to the fallback language when a translation is missing", async () => {
    const posts = await getAllBlogPosts("es")
    expect(posts.find(post => post.slug === "older")?.title).toBe("Older")
  })

  it("merges metadata, lowercases tags and adds the body and reading time", async () => {
    const older = (await getAllBlogPosts()).find(post => post.slug === "older")
    expect(older).toMatchObject({
      publishedAt: "2024-01-01",
      tags: ["astro", "typescript"],
      readingTime: 2,
      body: "word ".repeat(150),
    })
    expect(older?.entry.id).toBe("en/older")
  })

  it("throws when metadata points to a missing MDX file", async () => {
    collections.blogMetadata.push(
      blogMetadata("ghost", "2025-01-01", {
        availableLanguages: ["pt-br"],
        fallbackLanguage: "pt-br",
      })
    )
    await expect(getAllBlogPosts()).rejects.toThrow(/"ghost" declares pt-br/)
  })
})

describe("getBlogPost", () => {
  beforeEach(() => {
    collections.blog = [blogPost("draft", "en", "Draft")]
    collections.blogMetadata = [blogMetadata("draft", "2025-09-01", { featured: false })]
  })

  it("finds posts that are not featured", async () => {
    expect((await getBlogPost("en", "draft"))?.title).toBe("Draft")
  })

  it("returns undefined for an unknown slug", async () => {
    expect(await getBlogPost("en", "missing")).toBeUndefined()
  })
})

describe("getAllWorkItems", () => {
  it("merges metadata case-insensitively and sorts by end date, current roles first", async () => {
    collections.work = [
      { id: "old-job", data: { title: "Old" }, body: "old" },
      { id: "Current-Job", data: { title: "Current" } },
      { id: "recent-job", data: { title: "Recent" } },
    ]
    collections.workMetadata = [
      { id: "old-job", data: { slug: "old-job", end: "Jan 2020" } },
      { id: "current-job", data: { slug: "current-job", end: "Present" } },
      { id: "recent-job", data: { slug: "recent-job", end: "Mar 2024" } },
    ]

    const items = await getAllWorkItems()
    expect(items.map(item => item.slug)).toEqual(["current-job", "recent-job", "old-job"])
    expect(items[2].body).toBe("old")
    expect(items[0].body).toBe("")
  })

  it("throws when a work entry has no metadata", async () => {
    collections.work = [{ id: "orphan", data: {} }]
    collections.workMetadata = []
    await expect(getAllWorkItems()).rejects.toThrow(/"orphan" has no metadata/)
  })
})

describe("getAllProjects", () => {
  it("merges metadata case-insensitively and keeps collection order", async () => {
    collections.projects = [
      { id: "Beta", data: { title: "Beta" }, body: "beta" },
      { id: "alpha", data: { title: "Alpha" } },
    ]
    collections.projectMetadata = [
      { id: "alpha", data: { slug: "alpha", assetKey: "a" } },
      { id: "beta", data: { slug: "beta", assetKey: "b" } },
    ]

    const projects = await getAllProjects()
    expect(projects.map(project => [project.slug, project.assetKey, project.body])).toEqual([
      ["beta", "b", "beta"],
      ["alpha", "a", ""],
    ])
  })

  it("throws when a project has no metadata", async () => {
    collections.projects = [{ id: "orphan", data: {} }]
    collections.projectMetadata = []
    await expect(getAllProjects()).rejects.toThrow(/"orphan" has no metadata/)
  })
})

describe("BYO content", () => {
  beforeEach(() => {
    collections.byo = [
      byoEntry("en", "shell", "project", "shell", { title: "Shell", translationKey: "shell" }),
      byoEntry("en", "http", "project", "http", { title: "HTTP", translationKey: "http" }),
      byoEntry("en", "shell", "lesson", "lesson-02", { order: 2 }),
      byoEntry("en", "shell", "lesson", "lesson-01", { order: 1 }),
      byoEntry("en", "shell", "guide", "guide", { order: 1 }),
      byoEntry("en", "shell", "exercise", "exercise", { order: 1 }),
      byoEntry("en", "http", "lesson", "lesson-01", { order: 1 }),
      byoEntry("es", "shell", "project", "shell", { title: "Shell", translationKey: "shell" }),
    ]
  })

  it("groups entries by project, sorted by title then order", async () => {
    const bundles = await getAllByoProjects()
    expect(bundles.map(bundle => bundle.project.data.slug)).toEqual(["http", "shell"])

    const shell = bundles[1]
    expect(shell.lessons.map(lesson => lesson.data.slug)).toEqual(["lesson-01", "lesson-02"])
    expect(shell.guides).toHaveLength(1)
    expect(shell.exercises).toHaveLength(1)
    expect(bundles[0].lessons).toHaveLength(1)
  })

  it("only returns entries for the requested locale", async () => {
    const bundles = await getAllByoProjects("es")
    expect(bundles).toHaveLength(1)
    expect(bundles[0].lessons).toEqual([])
    expect(await getAllByoProjects("pt-br")).toEqual([])
  })

  it("finds a project by slug", async () => {
    expect((await getByoProject("en", "shell"))?.project.data.title).toBe("Shell")
    expect(await getByoProject("en", "missing")).toBeUndefined()
  })

  it("finds lessons, guides and exercises within a project", async () => {
    const lesson = await getByoContent("en", "shell", "lesson", "lesson-02")
    expect(lesson?.entry.id).toBe("en/shell/lesson-02")
    expect(lesson?.bundle.project.data.slug).toBe("shell")
    expect((await getByoContent("en", "shell", "guide", "guide"))?.entry.data.type).toBe("guide")
    expect((await getByoContent("en", "shell", "exercise", "exercise"))?.entry.data.type).toBe(
      "exercise"
    )
  })

  it("returns undefined for an unknown project or entry", async () => {
    expect(await getByoContent("en", "missing", "lesson", "lesson-01")).toBeUndefined()
    expect(await getByoContent("en", "shell", "lesson", "lesson-99")).toBeUndefined()
  })
})
