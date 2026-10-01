import type { APIRoute } from "astro"
import { getAllBlogPosts } from "@/lib/content"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  const posts = await getAllBlogPosts("en", { featuredOnly: false })
  const tags = [...new Set(posts.flatMap(post => post.tags ?? []).map(tag => tag.toLowerCase()))]
  return tags.map(tag => ({ params: { tag } }))
}
export const GET: APIRoute = ({ params }) =>
  createOgImage(`Posts tagged ${params.tag?.replaceAll("-", " ") ?? ""}`, "Blog")
