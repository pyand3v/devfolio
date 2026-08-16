import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { siteMetadata } from "@/data/site"
import { createOgImage } from "@/lib/og"
export async function getStaticPaths() {
  const projects = await getCollection("projects")
  return projects.map(project => ({
    params: { slug: project.id.replace(/\.mdx$/, "") },
    props: { title: project.data.title },
  }))
}
export const GET: APIRoute = ({ props }) =>
  createOgImage(props.title, "Project", siteMetadata.theme)
