import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { getAllBlogPosts } from "@/lib/content"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  const posts = await getAllBlogPosts("en", { featuredOnly: false })
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { title: post.title },
  }))
}
export const GET: APIRoute = ({ props }) =>
  createOgImage(props.title, "Blog post", siteMetadata.theme)
