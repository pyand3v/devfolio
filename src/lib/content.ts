import { getCollection, type CollectionEntry } from "astro:content"
import { PRESENT } from "@/lib/constants"
import { getReadingTime } from "@/lib/utils"

export type BlogPost = CollectionEntry<"blog">["data"] & {
  slug: string
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

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const posts = await getCollection("blog")
  return posts
    .filter(post => featuredBlogPostSlugs.has(post.id.replace(/\.mdx$/, "")))
    .map(post => ({
      ...post.data,
      slug: post.id.replace(/\.mdx$/, ""),
      body: post.body ?? "",
      tags: post.data.tags?.map(tag => tag.toLowerCase()),
      readingTime: getReadingTime(post.body ?? ""),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
