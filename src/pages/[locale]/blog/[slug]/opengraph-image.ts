import type { APIRoute } from "astro"
import { getAllBlogPosts } from "@/lib/content"
import { copy, locales, type Locale } from "@/lib/i18n"
import { createOgImage } from "@/lib/og"

// Translated posts are their own canonical pages, so they get a preview in their language. Posts shown in
// English for lack of a translation point at the English post and its image instead.
export async function getStaticPaths() {
  const paths = await Promise.all(
    locales
      .filter(locale => locale !== "en")
      .map(async locale =>
        (await getAllBlogPosts(locale, { featuredOnly: false }))
          .filter(post => post.locale === locale)
          .map(post => ({ params: { locale, slug: post.slug }, props: { title: post.title } }))
      )
  )
  return paths.flat()
}

export const GET: APIRoute = ({ params, props }) =>
  createOgImage(props.title, copy[params.locale as Locale].nav.blog)
