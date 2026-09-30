import { getCollection, type CollectionEntry } from "astro:content"
import { PRESENT } from "@/lib/constants"
import { defaultLocale, locales, type Locale } from "@/lib/i18n"
import { getReadingTime } from "@/lib/utils"

export type BlogPost = CollectionEntry<"blog">["data"] & {
  entry: CollectionEntry<"blog">
  featured: boolean
  publishedAt: string
  updatedAt: string
  availableLanguages: Locale[]
  body: string
  readingTime: number
}

export type WorkItem = CollectionEntry<"work">["data"] & {
  entry: CollectionEntry<"work">
  body: string
}
export type Project = CollectionEntry<"projects">["data"] & {
  entry: CollectionEntry<"projects">
  body: string
}
export type ByoEntry = CollectionEntry<"byo">
export type ByoProject = ByoEntry & { data: Extract<ByoEntry["data"], { type: "project" }> }
export type ByoLesson = ByoEntry & { data: Extract<ByoEntry["data"], { type: "lesson" }> }
export type ByoGuide = ByoEntry & { data: Extract<ByoEntry["data"], { type: "guide" }> }
export type ByoExercise = ByoEntry & { data: Extract<ByoEntry["data"], { type: "exercise" }> }

export type ByoProjectBundle = {
  project: ByoProject
  lessons: ByoLesson[]
  guides: ByoGuide[]
  exercises: ByoExercise[]
}

export async function getAllBlogPosts(
  locale: Locale = defaultLocale,
  { featuredOnly = true }: { featuredOnly?: boolean } = {}
): Promise<BlogPost[]> {
  const translationsBySlug = new Map<string, Map<Locale, CollectionEntry<"blog">>>()
  for (const entry of await getCollection("blog")) {
    const translations = translationsBySlug.get(entry.data.slug) ?? new Map()
    translations.set(entry.data.locale, entry)
    translationsBySlug.set(entry.data.slug, translations)
  }

  return [...translationsBySlug]
    .map(([slug, translations]) => {
      const source = translations.get(defaultLocale)
      if (!source?.data.publishedAt) {
        throw new Error(`Blog post "${slug}" has no ${defaultLocale} version with publishedAt.`)
      }
      const entry = translations.get(locale) ?? source
      const { publishedAt, updatedAt = publishedAt, featured = false } = source.data

      return {
        ...entry.data,
        slug,
        featured,
        publishedAt,
        updatedAt,
        availableLanguages: locales.filter(code => translations.has(code)),
        entry,
        body: entry.body ?? "",
        tags: entry.data.tags?.map(tag => tag.toLowerCase()),
        readingTime: getReadingTime(entry.body ?? ""),
      }
    })
    .filter(post => !featuredOnly || post.featured)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() ||
        a.slug.localeCompare(b.slug)
    )
}

export async function getBlogPost(locale: Locale, slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllBlogPosts(locale, { featuredOnly: false })
  return posts.find(post => post.slug === slug)
}

export async function getAllWorkItems(): Promise<WorkItem[]> {
  const items = await getCollection("work")
  return items
    .map(item => ({ ...item.data, entry: item, body: item.body ?? "" }))
    .sort((a, b) => {
      const endA = a.end === PRESENT ? new Date() : new Date(a.end)
      const endB = b.end === PRESENT ? new Date() : new Date(b.end)
      return endB.getTime() - endA.getTime()
    })
}

export async function getAllProjects(): Promise<Project[]> {
  const projects = await getCollection("projects")
  // Newest first. startDate is YYYY-MM, so comparing the strings compares the dates
  return projects
    .map(project => ({ ...project.data, entry: project, body: project.body ?? "" }))
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || a.slug.localeCompare(b.slug))
}

function sortByOrder<T extends { data: { order: number } }>(entries: T[]): T[] {
  return entries.sort((a, b) => a.data.order - b.data.order)
}

export async function getAllByoProjects(
  locale: Locale = defaultLocale
): Promise<ByoProjectBundle[]> {
  const entries = await getCollection("byo", entry => entry.data.locale === locale)
  const projects = entries.filter((entry): entry is ByoProject => entry.data.type === "project")
  const lessons = entries.filter((entry): entry is ByoLesson => entry.data.type === "lesson")
  const guides = entries.filter((entry): entry is ByoGuide => entry.data.type === "guide")
  const exercises = entries.filter((entry): entry is ByoExercise => entry.data.type === "exercise")

  return projects
    .map(project => ({
      project,
      lessons: sortByOrder(lessons.filter(item => item.data.project === project.data.slug)),
      guides: sortByOrder(guides.filter(item => item.data.project === project.data.slug)),
      exercises: sortByOrder(exercises.filter(item => item.data.project === project.data.slug)),
    }))
    .sort((a, b) => a.project.data.title.localeCompare(b.project.data.title))
}

export async function getByoProject(
  locale: Locale,
  slug: string
): Promise<ByoProjectBundle | undefined> {
  return (await getAllByoProjects(locale)).find(bundle => bundle.project.data.slug === slug)
}

export async function getByoContent(
  locale: Locale,
  projectSlug: string,
  type: "lesson" | "guide" | "exercise",
  slug: string
): Promise<{ bundle: ByoProjectBundle; entry: ByoLesson | ByoGuide | ByoExercise } | undefined> {
  const bundle = await getByoProject(locale, projectSlug)
  if (!bundle) return undefined
  const entries =
    type === "lesson" ? bundle.lessons : type === "guide" ? bundle.guides : bundle.exercises
  const entry = entries.find(item => item.data.slug === slug)
  return entry ? { bundle, entry } : undefined
}
