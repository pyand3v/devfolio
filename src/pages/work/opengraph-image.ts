import type { APIRoute } from "astro"
import { createOgImage } from "@/lib/og"
export const GET: APIRoute = () => createOgImage("Work Experience", "Career journey")
