import { describe, it, expect } from "vitest"
import { blogTagGroups, groupBlogTags } from "@/data/blog-tags"

const tag = (name: string, count = 1) => ({ tag: name, count })

describe("groupBlogTags", () => {
  it("files tags under their group in the taxonomy's order", () => {
    const groups = groupBlogTags([tag("redis"), tag("css"), tag("sql"), tag("jvm")], "en")
    expect(groups.map(group => group.id)).toEqual(["frontend", "java", "data"])
    expect(groups.find(group => group.id === "data")!.tags.map(t => t.tag)).toEqual([
      "sql",
      "redis",
    ])
  })

  it("drops groups with no tags", () => {
    expect(groupBlogTags([tag("css")], "en").map(group => group.id)).toEqual(["frontend"])
  })

  it("puts unlisted tags in a sorted, localized Other group", () => {
    const groups = groupBlogTags([tag("zig"), tag("css"), tag("bash")], "es")
    expect(groups.at(-1)).toEqual({ id: "other", label: "Otros", tags: [tag("bash"), tag("zig")] })
  })

  it("localizes group labels and keeps counts", () => {
    const [group] = groupBlogTags([tag("java", 4)], "pt-br")
    expect(group).toEqual({ id: "java", label: "Java e JVM", tags: [tag("java", 4)] })
  })

  it("returns nothing for no tags", () => {
    expect(groupBlogTags([], "en")).toEqual([])
  })

  it("lists each tag in at most one group", () => {
    const all = blogTagGroups.flatMap(group => group.tags)
    expect(new Set(all).size).toBe(all.length)
  })
})
