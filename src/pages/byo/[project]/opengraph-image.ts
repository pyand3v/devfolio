import type { APIRoute } from "astro"
import { getAllByoProjects } from "@/lib/content"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  return (await getAllByoProjects("en")).map(bundle => ({
    params: { project: bundle.project.data.slug },
    props: { title: bundle.project.data.title },
  }))
}
export const GET: APIRoute = ({ props }) => createOgImage(props.title, "Build your own")
