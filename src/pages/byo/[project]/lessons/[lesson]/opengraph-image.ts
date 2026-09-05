import type { APIRoute } from "astro"
import { getAllByoProjects } from "@/lib/content"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  return (await getAllByoProjects("en")).flatMap(bundle =>
    bundle.lessons.map(entry => ({
      params: { project: bundle.project.data.slug, lesson: entry.data.slug },
      props: { title: entry.data.title },
    }))
  )
}
export const GET: APIRoute = ({ props }) => createOgImage(props.title, "BYO lesson", "rose")
