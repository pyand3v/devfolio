import { getCollection, type CollectionEntry } from "astro:content"
import { PRESENT } from "@/lib/constants"
import type { Locale } from "@/lib/i18n"
import { getReadingTime } from "@/lib/utils"

export type BlogPost = CollectionEntry<"blog">["data"] & {
  entry: CollectionEntry<"blog">
  slug: string
  publishedAt: string
  updatedAt: string
  availableLanguages: Locale[]
  fallbackLanguage: Locale
  body: string
  readingTime: number
}

export type WorkItem = CollectionEntry<"work">["data"] & {
  entry: CollectionEntry<"work">
  slug: string
  body: string
}
export type Project = CollectionEntry<"projects">["data"] & {
  entry: CollectionEntry<"projects">
  slug: string
  assetKey: string
  body: string
}

export async function getAllBlogPosts(
  locale: Locale = "en",
  { featuredOnly = true }: { featuredOnly?: boolean } = {}
): Promise<BlogPost[]> {
  const [posts, metadata] = await Promise.all([
    getCollection("blog"),
    getCollection("blogMetadata"),
  ])
  const postFor = new Map(
    posts.map(post => [`${post.data.translationKey}:${post.data.locale}`, post])
  )

  return metadata
    .filter(record => !featuredOnly || record.data.featured)
    .map(record => {
      const resolvedLocale = record.data.availableLanguages.includes(locale)
        ? locale
        : record.data.fallbackLanguage
      const entry = postFor.get(`${record.id}:${resolvedLocale}`)

      if (!entry) {
        throw new Error(
          `Article metadata "${record.id}" declares ${resolvedLocale}, but no matching MDX file exists.`
        )
      }

      return {
        ...entry.data,
        ...record.data,
        entry,
        body: entry.body ?? "",
        tags: entry.data.tags?.map(tag => tag.toLowerCase()),
        readingTime: getReadingTime(entry.body ?? ""),
      }
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function getBlogPost(locale: Locale, slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllBlogPosts(locale, { featuredOnly: false })
  return posts.find(post => post.slug === slug)
}

export async function getAllWorkItems(): Promise<WorkItem[]> {
  const [items, metadata] = await Promise.all([
    getCollection("work"),
    getCollection("workMetadata"),
  ])
  const metadataByKey = new Map(metadata.map(record => [record.id.toLowerCase(), record]))
  return items
    .map(item => {
      const record = metadataByKey.get(item.id.toLowerCase())
      if (!record) throw new Error(`Work entry "${item.id}" has no metadata file.`)
      return { ...item.data, ...record.data, entry: item, body: item.body ?? "" }
    })
    .sort((a, b) => {
      const endA = a.end === PRESENT ? new Date() : new Date(a.end)
      const endB = b.end === PRESENT ? new Date() : new Date(b.end)
      return endB.getTime() - endA.getTime()
    })
}

export async function getAllProjects(): Promise<Project[]> {
  const [projects, metadata] = await Promise.all([
    getCollection("projects"),
    getCollection("projectMetadata"),
  ])
  const metadataByKey = new Map(metadata.map(record => [record.id.toLowerCase(), record]))
  return projects.map(project => {
    const record = metadataByKey.get(project.id.toLowerCase())
    if (!record) throw new Error(`Project entry "${project.id}" has no metadata file.`)
    return { ...project.data, ...record.data, entry: project, body: project.body ?? "" }
  })
}
