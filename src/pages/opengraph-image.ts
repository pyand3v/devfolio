import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { createOgImage } from "@/lib/og"
export const GET: APIRoute = () =>
  createOgImage(siteMetadata.title, "Developer portfolio", siteMetadata.theme)
