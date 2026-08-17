import type { Locale } from "@/lib/i18n"

export interface BlogTag {
  tag: string
  count: number
}

interface BlogTagGroupDefinition {
  id: string
  label: Record<Locale, string>
  tags: string[]
}

export interface GroupedBlogTags {
  id: string
  label: string
  tags: BlogTag[]
}

/**
 * The blog's browse taxonomy. Article frontmatter remains the source of truth
 * for tags; add a tag here only when it should be filed under a named group.
 * Unlisted tags are displayed automatically in the localized "Other" group.
 */
export const blogTagGroups: BlogTagGroupDefinition[] = [
  {
    id: "frontend",
    label: { en: "Frontend", es: "Frontend", "pt-br": "Frontend" },
    tags: ["css", "design systems", "frontend", "tailwind css", "utility-first"],
  },
  {
    id: "java",
    label: { en: "Java & JVM", es: "Java y JVM", "pt-br": "Java e JVM" },
    tags: ["java", "jvm", "internals", "concurrency", "multithreading", "threads"],
  },
  {
    id: "data",
    label: { en: "Data & caching", es: "Datos y caché", "pt-br": "Dados e cache" },
    tags: ["databases", "sql", "nosql", "caching", "redis", "memcached"],
  },
  {
    id: "systems",
    label: { en: "Systems", es: "Sistemas", "pt-br": "Sistemas" },
    tags: [
      "architecture",
      "system design",
      "networking",
      "load balancer",
      "reverse proxy",
      "reliability",
      "scalability",
      "performance",
    ],
  },
]

const otherLabels: Record<Locale, string> = { en: "Other", es: "Otros", "pt-br": "Outros" }

export function groupBlogTags(tags: BlogTag[], locale: Locale): GroupedBlogTags[] {
  const remaining = new Map(tags.map(tag => [tag.tag, tag]))
  const groups = blogTagGroups
    .map(group => {
      const groupedTags = group.tags.flatMap(tag => {
        const entry = remaining.get(tag)
        if (entry) remaining.delete(tag)
        return entry ? [entry] : []
      })
      return { id: group.id, label: group.label[locale], tags: groupedTags }
    })
    .filter(group => group.tags.length)

  const otherTags = [...remaining.values()].sort((a, b) => a.tag.localeCompare(b.tag))
  return otherTags.length
    ? [...groups, { id: "other", label: otherLabels[locale], tags: otherTags }]
    : groups
}
