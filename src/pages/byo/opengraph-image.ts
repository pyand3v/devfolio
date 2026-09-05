import type { APIRoute } from "astro"
import { createOgImage } from "@/lib/og"
export const GET: APIRoute = () =>
  createOgImage("Build Your Own", "Practical learning paths", "rose")
