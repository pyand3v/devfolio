import { describe, it, expect, vi, afterEach } from "vitest"
import {
  altFromFileName,
  blogPostPath,
  branchForTitle,
  byoEntryPath,
  isConventionalTitle,
  isoWithOffset,
  mediaFileName,
  mediaFolder,
  nextOrder,
  parseMdx,
  parseMediaTarget,
  slugify,
  stringifyMdx,
  translationFrontmatter,
} from "@/lib/content-files"

describe("slugify", () => {
  it("makes lowercase kebab-case without accents or punctuation", () => {
    expect(slugify("Hola, Señor! ¿Qué tal?")).toBe("hola-senor-que-tal")
    expect(slugify("  Build Your Own: CLI  ")).toBe("build-your-own-cli")
    expect(slugify("Concorrência em Java")).toBe("concorrencia-em-java")
  })

  it("returns an empty string when nothing is left", () => {
    expect(slugify("¿?!")).toBe("")
  })
})

describe("isoWithOffset", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("formats local time with a negative UTC offset", () => {
    const date = new Date(2026, 8, 30, 9, 5, 7)
    vi.spyOn(date, "getTimezoneOffset").mockReturnValue(180)
    expect(isoWithOffset(date)).toBe("2026-09-30T09:05:07-03:00")
  })

  it("formats a positive offset with minutes", () => {
    const date = new Date(2026, 0, 2, 23, 0, 0)
    vi.spyOn(date, "getTimezoneOffset").mockReturnValue(-330)
    expect(isoWithOffset(date)).toBe("2026-01-02T23:00:00+05:30")
  })
})

describe("nextOrder", () => {
  it("returns one past the highest order, or 1 when there are none", () => {
    expect(nextOrder([1, 3, 2])).toBe(4)
    expect(nextOrder([])).toBe(1)
  })
})

describe("parseMdx and stringifyMdx", () => {
  it("round-trips frontmatter and body", () => {
    const source = stringifyMdx({ title: "Hello", tags: ["a", "b"] }, "\n\n## Body\n\nText\n")
    expect(source).toBe("---\ntitle: Hello\ntags:\n  - a\n  - b\n---\n\n## Body\n\nText\n")
    expect(parseMdx(source)).toEqual({
      data: { title: "Hello", tags: ["a", "b"] },
      body: "## Body\n\nText\n",
    })
  })

  it("quotes timestamps and leaves no body section when the body is empty", () => {
    const source = stringifyMdx({ publishedAt: "2026-09-30T09:00:00-03:00", day: "2026-09-30" })
    expect(source).toBe('---\npublishedAt: "2026-09-30T09:00:00-03:00"\nday: 2026-09-30\n---\n')
  })

  it("doesn't wrap long strings", () => {
    const summary = "word ".repeat(40).trim()
    expect(stringifyMdx({ summary })).toContain(`summary: ${summary}\n`)
  })

  it("reads CRLF files, empty frontmatter and files without a body", () => {
    expect(parseMdx("---\r\ntitle: Hi\r\n---\r\nBody")).toEqual({
      data: { title: "Hi" },
      body: "Body",
    })
    expect(parseMdx("---\n\n---\n")).toEqual({ data: {}, body: "" })
    expect(parseMdx("---\ntitle: Hi\n---")).toEqual({ data: { title: "Hi" }, body: "" })
  })

  it("throws when there's no frontmatter", () => {
    expect(() => parseMdx("# Just a heading")).toThrow(/no frontmatter/)
  })
})

describe("entry paths", () => {
  it("builds blog post paths, defaulting to the default locale", () => {
    expect(blogPostPath("my-post")).toBe("src/data/blog/en/my-post.mdx")
    expect(blogPostPath("my-post", "pt-br")).toBe("src/data/blog/pt-br/my-post.mdx")
  })

  it("builds BYO paths, with the course's own entry as project.mdx", () => {
    expect(byoEntryPath("es", "shell")).toBe("src/data/byo/es/shell/project.mdx")
    expect(byoEntryPath("es", "shell", "intro")).toBe("src/data/byo/es/shell/intro.mdx")
  })
})

describe("translationFrontmatter", () => {
  it("drops the fields every translation shares", () => {
    const source = {
      title: "Hello",
      summary: "Hi",
      tags: ["x"],
      featured: true,
      publishedAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-02T00:00:00Z",
    }
    expect(translationFrontmatter(source)).toEqual({ title: "Hello", summary: "Hi", tags: ["x"] })
  })
})

describe("media", () => {
  it("parses image targets", () => {
    expect(parseMediaTarget("blog/my-post")).toEqual({ collection: "blog", slug: "my-post" })
    expect(parseMediaTarget("projects/app")).toEqual({ collection: "projects", slug: "app" })
    expect(parseMediaTarget("byo/shell")).toEqual({ collection: "byo", slug: "shell" })
    expect(parseMediaTarget("work")).toEqual({ collection: "work" })
  })

  it("rejects unknown or incomplete targets", () => {
    for (const target of ["blog", "work/x", "things/x", "blog/a/b", ""]) {
      expect(parseMediaTarget(target)).toBeUndefined()
    }
  })

  it("maps targets to public folders", () => {
    expect(mediaFolder({ collection: "blog", slug: "my-post" })).toBe("/blog/my-post")
    expect(mediaFolder({ collection: "work" })).toBe("/work")
  })

  it("cleans up file names", () => {
    expect(mediaFileName("C:\\shots\\Screen Shot 1.PNG")).toBe("screen-shot-1.png")
    expect(mediaFileName("/tmp/Diagrama Açaí.webp")).toBe("diagrama-acai.webp")
    expect(mediaFileName("README")).toBe("readme")
    expect(mediaFileName("¿?.jpg")).toBe("image.jpg")
    expect(mediaFileName(".hidden")).toBe("hidden")
  })

  it("makes alt text from a file name", () => {
    expect(altFromFileName("home-screen_v2.png")).toBe("Home screen v2")
  })
})

describe("PR titles", () => {
  it("accepts Conventional Commits titles", () => {
    expect(isConventionalTitle("content(blog): add post on caching")).toBe(true)
    expect(isConventionalTitle("content: update several posts")).toBe(true)
    expect(isConventionalTitle("feat(byo)!: change lesson urls")).toBe(true)
  })

  it("rejects other titles", () => {
    expect(isConventionalTitle("Add post")).toBe(false)
    expect(isConventionalTitle("content(blog): add post.")).toBe(false)
    expect(isConventionalTitle("content(Blog): add post")).toBe(false)
    expect(isConventionalTitle("post(blog): add post")).toBe(false)
  })

  it("makes a content branch name from a title", () => {
    expect(branchForTitle("content(blog): add post on Caching & Redis")).toBe(
      "content/add-post-on-caching-redis"
    )
    expect(branchForTitle("content: ¿?")).toBe("content/update")
    expect(branchForTitle(`content: ${"very long words ".repeat(10)}`)).toBe(
      "content/very-long-words-very-long-words-very-long-words"
    )
  })
})
