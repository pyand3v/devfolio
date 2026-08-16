import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"

export const GET: APIRoute = () =>
  new Response(
    `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_astro/\nDisallow: /private/\n\nSitemap: ${siteMetadata.siteUrl}/sitemap.xml\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  )
