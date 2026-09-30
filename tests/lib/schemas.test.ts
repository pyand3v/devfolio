import { describe, it, expect } from "vitest"
import {
  BlogPostSchema,
  ByoEntrySchema,
  fieldsFromPath,
  ProjectSchema,
  resolveEntryData,
  WorkItemSchema,
} from "@/lib/schemas"

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map(issue => issue.message) ?? []

describe("BlogPostSchema", () => {
  const english = {
    locale: "en",
    slug: "hello-world",
    title: "Hello World",
    summary: "A test post",
    tags: ["react"],
    featured: true,
    publishedAt: "2024-01-15T09:00:00-03:00",
  }
  const spanish = { locale: "es", slug: "hello-world", title: "Hola", summary: "Una prueba" }

  it("parses a default-locale post and a translation", () => {
    expect(BlogPostSchema.parse(english)).toEqual(english)
    expect(BlogPostSchema.parse(spanish)).toEqual(spanish)
  })

  it("requires publishedAt in the default-locale version", () => {
    const { publishedAt: _publishedAt, ...undated } = english
    expect(messages(BlogPostSchema.safeParse(undated))).toEqual([
      "publishedAt is required in the en version",
    ])
  })

  it("keeps shared fields out of translations", () => {
    const result = BlogPostSchema.safeParse({ ...spanish, featured: false })
    expect(messages(result)).toEqual([
      "featured belongs only in the en version, which every translation shares",
    ])
  })

  it("normalizes a YAML date to an ISO string", () => {
    const parsed = BlogPostSchema.parse({
      ...english,
      publishedAt: new Date("2024-01-15T12:00:00Z"),
    })
    expect(parsed.publishedAt).toBe("2024-01-15T12:00:00.000Z")
  })

  it("rejects an invalid slug, locale or date", () => {
    expect(BlogPostSchema.safeParse({ ...english, slug: "Hello World" }).success).toBe(false)
    expect(BlogPostSchema.safeParse({ ...english, locale: "fr" }).success).toBe(false)
    expect(BlogPostSchema.safeParse({ ...english, publishedAt: "2024-01-15" }).success).toBe(false)
  })

  it("rejects an empty title or summary", () => {
    expect(BlogPostSchema.safeParse({ ...english, title: "" }).success).toBe(false)
    expect(BlogPostSchema.safeParse({ ...english, summary: "" }).success).toBe(false)
  })
})

describe("WorkItemSchema", () => {
  const valid = {
    slug: "engineer-acme",
    company: "Acme Corp",
    title: "Software Engineer",
    start: "Jan 2022",
    end: "Present",
    description: "Built things",
    locations: ["Remote"],
  }

  it("parses valid frontmatter with optional fields omitted", () => {
    expect(WorkItemSchema.parse(valid)).toEqual(valid)
  })

  it("rejects missing locations", () => {
    const { locations: _locations, ...rest } = valid
    expect(WorkItemSchema.safeParse(rest).success).toBe(false)
  })
})

describe("ProjectSchema", () => {
  const valid = {
    slug: "my-app",
    title: "My App",
    image: "/projects/my-app/cover.png",
    description: "An app",
    startDate: "2023-01",
    endDate: "2023-06",
    techStack: ["React"],
    gallery: [{ src: "/projects/my-app/one.png", alt: "Home screen" }],
  }

  it("parses valid frontmatter with a gallery", () => {
    expect(ProjectSchema.parse(valid)).toEqual(valid)
  })

  it("requires alt text for gallery images", () => {
    const result = ProjectSchema.safeParse({ ...valid, gallery: [{ src: "/a.png" }] })
    expect(result.success).toBe(false)
  })

  it("rejects a non-numeric teamSize", () => {
    expect(ProjectSchema.safeParse({ ...valid, teamSize: "four" }).success).toBe(false)
  })
})

describe("ByoEntrySchema", () => {
  const base = {
    locale: "en",
    slug: "lesson-01",
    project: "shell",
    title: "Intro",
    description: "",
  }

  it("parses a course with chapters", () => {
    const course = {
      ...base,
      slug: "shell",
      type: "project",
      estimatedMinutes: 60,
      chapters: [{ order: 1, title: "Start", description: "" }],
    }
    expect(ByoEntrySchema.parse(course)).toMatchObject({ type: "project", estimatedMinutes: 60 })
  })

  it("parses lessons, guides and exercises", () => {
    expect(ByoEntrySchema.parse({ ...base, type: "lesson", chapter: 1, order: 1 }).type).toBe(
      "lesson"
    )
    expect(ByoEntrySchema.parse({ ...base, type: "guide", order: 1 }).type).toBe("guide")
    expect(
      ByoEntrySchema.parse({ ...base, type: "exercise", order: 1, difficulty: "easy" }).type
    ).toBe("exercise")
  })

  it("rejects a lesson without a chapter or an exercise without a difficulty", () => {
    expect(ByoEntrySchema.safeParse({ ...base, type: "lesson", order: 1 }).success).toBe(false)
    expect(ByoEntrySchema.safeParse({ ...base, type: "exercise", order: 1 }).success).toBe(false)
  })

  it("rejects an unknown type or a non-positive order", () => {
    expect(ByoEntrySchema.safeParse({ ...base, type: "quiz", order: 1 }).success).toBe(false)
    expect(ByoEntrySchema.safeParse({ ...base, type: "guide", order: 0 }).success).toBe(false)
  })
})

describe("fieldsFromPath", () => {
  it("reads the locale and slug of a blog post", () => {
    expect(fieldsFromPath("blog", "es/my-post")).toEqual({ locale: "es", slug: "my-post" })
  })

  it("reads the slug of work entries and projects", () => {
    expect(fieldsFromPath("work", "engineer-acme")).toEqual({ slug: "engineer-acme" })
    expect(fieldsFromPath("projects", "my-app")).toEqual({ slug: "my-app" })
  })

  it("reads the locale, course and slug of BYO entries", () => {
    expect(fieldsFromPath("byo", "pt-br/shell/lesson-01")).toEqual({
      locale: "pt-br",
      project: "shell",
      slug: "lesson-01",
    })
    expect(fieldsFromPath("byo", "en/shell/project")).toEqual({
      locale: "en",
      project: "shell",
      slug: "shell",
    })
  })

  it("returns undefined for a path in the wrong place", () => {
    expect(fieldsFromPath("blog", "my-post")).toBeUndefined()
    expect(fieldsFromPath("blog", "fr/my-post")).toBeUndefined()
    expect(fieldsFromPath("work", "nested/entry")).toBeUndefined()
    expect(fieldsFromPath("byo", "en/lesson-01")).toBeUndefined()
  })
})

describe("resolveEntryData", () => {
  it("adds the path fields to the frontmatter", () => {
    expect(resolveEntryData("blog", "en/my-post", { title: "Mine" })).toEqual({
      data: { title: "Mine", locale: "en", slug: "my-post" },
      errors: [],
    })
  })

  it("accepts frontmatter that repeats a path field", () => {
    const { errors } = resolveEntryData("byo", "en/shell/lesson-01", { project: "shell" })
    expect(errors).toEqual([])
  })

  it("reports frontmatter that contradicts the path", () => {
    const { errors } = resolveEntryData("byo", "en/shell/lesson-01", { project: "http" })
    expect(errors).toEqual(['project is "http", but the file path says "shell"'])
  })

  it("reports a file in the wrong place", () => {
    const { data, errors } = resolveEntryData("blog", "my-post", { title: "Mine" })
    expect(data).toEqual({ title: "Mine" })
    expect(errors).toEqual(["must be at src/data/blog/<locale>/<slug>.mdx"])
  })
})
