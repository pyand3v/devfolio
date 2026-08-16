import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { createOgImage } from "@/lib/og"
import { getAllWorkItems } from "@/lib/content"
export async function getStaticPaths() {
  const work = await getAllWorkItems()
  return work.map(item => ({
    params: { slug: item.slug },
    props: { title: `${item.title} @ ${item.company}` },
  }))
}
export const GET: APIRoute = ({ props }) =>
  createOgImage(props.title, "Work experience", siteMetadata.theme)
