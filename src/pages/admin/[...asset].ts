import type { APIRoute, GetStaticPaths } from "astro"
import { readFile } from "node:fs/promises"
import path from "node:path"

// Serves the Sveltia CMS bundle from the installed package, so the admin page loads it from this site
// (not a CDN) at the version in package.json. The script loads its chunks relative to its own URL.
const dist = path.join(process.cwd(), "node_modules", "@sveltia", "cms", "dist")
const assets = ["sveltia-cms.js", "chunks/react-dom.js"]

export const getStaticPaths = (() =>
  assets.map(asset => ({ params: { asset } }))) satisfies GetStaticPaths

export const GET: APIRoute = async ({ params }) =>
  new Response(await readFile(path.join(dist, params.asset!)), {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  })
