import fs from "node:fs"
import { describe, it, expect } from "vitest"

type HeaderRule = { source: string; headers: Array<{ key: string; value: string }> }

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8")) as { headers: HeaderRule[] }
const headersFor = (source: string) =>
  Object.fromEntries(
    (config.headers.find(rule => rule.source === source)?.headers ?? []).map(({ key, value }) => [
      key,
      value,
    ])
  )

describe("vercel.json headers", () => {
  const site = headersFor("/(.*)")

  it("keeps the site out of frames and off content sniffing", () => {
    expect(site["X-Frame-Options"]).toBe("DENY")
    expect(site["X-Content-Type-Options"]).toBe("nosniff")
    expect(site["Content-Security-Policy"]).toContain("frame-ancestors 'none'")
  })

  it("restricts base URLs, plugins and powerful features on every response", () => {
    expect(site["Content-Security-Policy"]).toContain("base-uri 'self'")
    expect(site["Content-Security-Policy"]).toContain("object-src 'none'")
    for (const feature of ["camera", "microphone", "geolocation", "payment", "usb"]) {
      expect(site["Permissions-Policy"]).toContain(`${feature}=()`)
    }
  })

  it("isolates the browsing context but keeps the CMS sign-in popup working", () => {
    expect(site["Cross-Origin-Opener-Policy"]).toBe("same-origin-allow-popups")
  })

  it("caches Astro's hashed assets for a year", () => {
    expect(headersFor("/_astro/(.*)")["Cache-Control"]).toBe("public, max-age=31536000, immutable")
  })

  it("serves the extensionless Open Graph images as PNG", () => {
    expect(headersFor("/opengraph-image")["Content-Type"]).toBe("image/png")
    expect(headersFor("/(.*)/opengraph-image")["Content-Type"]).toBe("image/png")
  })
})
