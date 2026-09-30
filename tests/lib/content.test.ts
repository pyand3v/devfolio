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

const blogPost = (
  slug: string,
  locale: string,
  title: string,
  extra: Record<string, unknown> = {}
) => ({
  id: `${locale}/${slug}`,
  data: { slug, locale, title, summary: `${title} summary`, ...extra },
  body: "word ".repeat(150),
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
      blogPost("older", "en", "Older", {
        tags: ["Astro", "TypeScript"],
        featured: true,
        publishedAt: "2024-01-01",
      }),
      blogPost("newer", "en", "Newer", {
        featured: true,
        publishedAt: "2025-06-01",
        updatedAt: "2025-07-01",
      }),
      blogPost("newer", "es", "Más nuevo"),
      blogPost("draft", "en", "Draft", { publishedAt: "2025-09-01" }),
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

  it("shares the default locale's dates and featured flag with translations", async () => {
    const [newer] = await getAllBlogPosts("es")
    expect(newer).toMatchObject({
      featured: true,
      publishedAt: "2025-06-01",
      updatedAt: "2025-07-01",
      availableLanguages: ["en", "es"],
    })
  })

  it("falls back to the default locale when a translation is missing", async () => {
    const posts = await getAllBlogPosts("es")
    expect(posts.find(post => post.slug === "older")?.title).toBe("Older")
  })

  it("defaults updatedAt to publishedAt, lowercases tags and adds the body and reading time", async () => {
    const older = (await getAllBlogPosts()).find(post => post.slug === "older")
    expect(older).toMatchObject({
      publishedAt: "2024-01-01",
      updatedAt: "2024-01-01",
      tags: ["astro", "typescript"],
      readingTime: 2,
      body: "word ".repeat(150),
    })
    expect(older?.entry.id).toBe("en/older")
  })

  it("orders posts published at the same time by slug", async () => {
    collections.blog.push(
      blogPost("aardvark", "en", "Aardvark", { featured: true, publishedAt: "2025-06-01" })
    )
    const posts = await getAllBlogPosts()
    expect(posts.map(post => post.slug)).toEqual(["aardvark", "newer", "older"])
  })

  it("throws when a post has no default-locale version", async () => {
    collections.blog.push(blogPost("ghost", "pt-br", "Fantasma"))
    await expect(getAllBlogPosts()).rejects.toThrow(/"ghost" has no en version/)
  })
})

describe("getBlogPost", () => {
  beforeEach(() => {
    collections.blog = [blogPost("draft", "en", "Draft", { publishedAt: "2025-09-01" })]
  })

  it("finds posts that are not featured", async () => {
    expect((await getBlogPost("en", "draft"))?.title).toBe("Draft")
  })

  it("returns undefined for an unknown slug", async () => {
    expect(await getBlogPost("en", "missing")).toBeUndefined()
  })
})

describe("getAllWorkItems", () => {
  it("sorts by end date, current roles first", async () => {
    collections.work = [
      { id: "old-job", data: { slug: "old-job", end: "Jan 2020" }, body: "old" },
      { id: "current-job", data: { slug: "current-job", end: "Present" } },
      { id: "recent-job", data: { slug: "recent-job", end: "Mar 2024" } },
    ]

    const items = await getAllWorkItems()
    expect(items.map(item => item.slug)).toEqual(["current-job", "recent-job", "old-job"])
    expect(items[2].body).toBe("old")
    expect(items[0].body).toBe("")
  })
})

describe("getAllProjects", () => {
  it("sorts newest first, then by slug, and adds the body", async () => {
    collections.projects = [
      { id: "alpha", data: { slug: "alpha", startDate: "2021-01" } },
      { id: "gamma", data: { slug: "gamma", startDate: "2023-05" }, body: "gamma" },
      { id: "beta", data: { slug: "beta", startDate: "2021-01" } },
    ]

    const projects = await getAllProjects()
    expect(projects.map(project => [project.slug, project.body])).toEqual([
      ["gamma", "gamma"],
      ["alpha", ""],
      ["beta", ""],
    ])
  })
})

describe("BYO content", () => {
  beforeEach(() => {
    collections.byo = [
      byoEntry("en", "shell", "project", "shell", { title: "Shell" }),
      byoEntry("en", "http", "project", "http", { title: "HTTP" }),
      byoEntry("en", "shell", "lesson", "lesson-02", { order: 2 }),
      byoEntry("en", "shell", "lesson", "lesson-01", { order: 1 }),
      byoEntry("en", "shell", "guide", "guide", { order: 1 }),
      byoEntry("en", "shell", "exercise", "exercise", { order: 1 }),
      byoEntry("en", "http", "lesson", "lesson-01", { order: 1 }),
      byoEntry("es", "shell", "project", "shell", { title: "Shell" }),
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
