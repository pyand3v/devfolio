import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { siteMetadata } from "@/data/site"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  const posts = await getCollection("blog")
  return posts.map(post => ({
    params: { slug: post.id.replace(/\.mdx$/, "") },
    props: { title: post.data.title },
  }))
}
export const GET: APIRoute = ({ props }) =>
  createOgImage(props.title, "Blog post", siteMetadata.theme)
