import type { APIRoute } from "astro"
import { getAllByoProjects } from "@/lib/content"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  return (await getAllByoProjects("en")).flatMap(bundle =>
    bundle.guides.map(entry => ({
      params: { project: bundle.project.data.slug, guide: entry.data.slug },
      props: { title: entry.data.title },
    }))
  )
}
export const GET: APIRoute = ({ props }) => createOgImage(props.title, "BYO guide", "rose")
