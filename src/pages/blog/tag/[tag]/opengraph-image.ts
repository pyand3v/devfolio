import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { siteMetadata } from "@/data/site"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  const posts = await getCollection("blog")
  const tags = [
    ...new Set(posts.flatMap(post => post.data.tags ?? []).map(tag => tag.toLowerCase())),
  ]
  return tags.map(tag => ({ params: { tag } }))
}
export const GET: APIRoute = ({ params }) =>
  createOgImage(
    `Posts tagged ${params.tag?.replaceAll("-", " ") ?? ""}`,
    "Blog",
    siteMetadata.theme
  )
