import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { getAllBlogPosts, getAllProjects, getAllWorkItems } from "@/lib/content"
import { formatDateRange } from "@/lib/utils"

export const GET: APIRoute = async () => {
  const [posts, projects, work] = await Promise.all([
    getAllBlogPosts(),
    getAllProjects(),
    getAllWorkItems(),
  ])
  const base = siteMetadata.siteUrl
  const blog = posts
    .map(post => `- [${post.title}](${base}/blog/${post.slug}): ${post.summary}`)
    .join("\n")
  const projectLines = projects
    .map(
      project =>
        `- [${project.title}](${base}/projects/${project.slug}) (${formatDateRange(project.startDate, project.endDate)}, ${project.techStack.join(", ")}): ${project.description}`
    )
    .join("\n")
  const jobs = work
    .map(
      item =>
        `- [${item.company}](${base}/work/${item.slug}): ${item.title}, ${formatDateRange(item.start, item.end)}. ${item.description}`
    )
    .join("\n")
  return new Response(
    `# ${siteMetadata.title}\n\n> ${siteMetadata.description}\n\n## Blog Posts\n\n${blog}\n\n## Projects\n\n${projectLines}\n\n## Work Experience\n\n${jobs}\n\n## Site\n\n- [Home](${base}): Introduction and previews of recent activity.\n- [Blog](${base}/blog): All blog posts.\n- [Projects](${base}/projects): All projects.\n- [Work](${base}/work): Full work history.\n- [RSS Feed](${base}/rss.xml): Subscribe to new blog posts.\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  )
}
