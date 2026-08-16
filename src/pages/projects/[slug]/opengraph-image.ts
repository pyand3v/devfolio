import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { createOgImage } from "@/lib/og"
import { getAllProjects } from "@/lib/content"
export async function getStaticPaths() {
  const projects = await getAllProjects()
  return projects.map(project => ({
    params: { slug: project.slug },
    props: { title: project.title },
  }))
}
export const GET: APIRoute = ({ props }) =>
  createOgImage(props.title, "Project", siteMetadata.theme)
