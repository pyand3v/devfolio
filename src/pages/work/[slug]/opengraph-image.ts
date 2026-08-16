import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { siteMetadata } from "@/data/site"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  const work = await getCollection("work")
  return work.map(item => ({
    params: { slug: item.id.replace(/\.mdx$/, "") },
    props: { title: `${item.data.title} @ ${item.data.company}` },
  }))
}
export const GET: APIRoute = ({ props }) =>
  createOgImage(props.title, "Work experience", siteMetadata.theme)
