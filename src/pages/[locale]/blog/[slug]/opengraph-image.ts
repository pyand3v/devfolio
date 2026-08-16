import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { getAllBlogPosts } from "@/lib/content"
import { locales } from "@/lib/i18n"
import { createOgImage } from "@/lib/og"

export async function getStaticPaths() {
  const paths = await Promise.all(
    locales
      .filter(locale => locale !== "en")
      .map(async locale => {
        const posts = await getAllBlogPosts(locale, { featuredOnly: false })
        return posts.map(post => ({ params: { locale, slug: post.slug }, props: { title: post.title } }))
      })
  )
  return paths.flat()
}

export const GET: APIRoute = ({ props }) =>
  createOgImage(props.title, "Blog post", siteMetadata.theme)
