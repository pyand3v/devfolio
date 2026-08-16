import { getCollection, type CollectionEntry } from "astro:content"
import { PRESENT } from "@/lib/constants"
import type { Locale } from "@/lib/i18n"
import { getReadingTime } from "@/lib/utils"

export type BlogPost = CollectionEntry<"blog">["data"] & {
  body: string
  readingTime: number
}

export type WorkItem = CollectionEntry<"work">["data"] & { slug: string; body: string }
export type Project = CollectionEntry<"projects">["data"] & { slug: string; body: string }

export const featuredBlogPostSlugs = new Set([
  "post15",
  "post14",
  "post13",
  "post12",
  "post11",
  "post10",
  "post9",
])

export async function getAllBlogPosts(locale: Locale = "en"): Promise<BlogPost[]> {
  const posts = await getCollection("blog")
  return posts
    .filter(post => post.data.locale === locale && featuredBlogPostSlugs.has(post.data.translationKey))
    .map(post => ({
      ...post.data,
      body: post.body ?? "",
      tags: post.data.tags?.map(tag => tag.toLowerCase()),
      readingTime: getReadingTime(post.body ?? ""),
    }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export async function getBlogPost(locale: Locale, slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllBlogPosts(locale)
  return posts.find(post => post.slug === slug)
}

export async function getAllWorkItems(): Promise<WorkItem[]> {
  const items = await getCollection("work")
  return items
    .map(item => ({ ...item.data, slug: item.id.replace(/\.mdx$/, ""), body: item.body ?? "" }))
    .sort((a, b) => {
      const endA = a.end === PRESENT ? new Date() : new Date(a.end)
      const endB = b.end === PRESENT ? new Date() : new Date(b.end)
      return endB.getTime() - endA.getTime()
    })
}

export async function getAllProjects(): Promise<Project[]> {
  const projects = await getCollection("projects")
  return projects.map(project => ({
    ...project.data,
    slug: project.id.replace(/\.mdx$/, ""),
    body: project.body ?? "",
  }))
}
