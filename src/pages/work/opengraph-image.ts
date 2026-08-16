import type { APIRoute } from "astro"
import { siteMetadata } from "@/data/site"
import { createOgImage } from "@/lib/og"
export const GET: APIRoute = () =>
  createOgImage("Work Experience", "Career journey", siteMetadata.theme)
