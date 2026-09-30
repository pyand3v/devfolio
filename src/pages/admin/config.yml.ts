import type { APIRoute } from "astro"
import { stringify } from "yaml"
import { siteMetadata } from "@/data/site"
import { cmsConfig } from "@/lib/cms-config"

export const GET: APIRoute = () =>
  new Response(stringify(cmsConfig(siteMetadata.siteUrl), { lineWidth: 0 }), {
    headers: { "Content-Type": "application/yaml; charset=utf-8" },
  })
