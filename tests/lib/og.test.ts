import fs from "node:fs"
import { describe, it, expect, vi } from "vitest"
import { createOgImage } from "@/lib/og"

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

async function render(title: string, subtitle: string) {
  const response = await createOgImage(title, subtitle)
  return { response, bytes: new Uint8Array(await response.arrayBuffer()) }
}

// Width and height are the first two fields of the IHDR chunk, right after the signature
function dimensions(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

describe("createOgImage", () => {
  it("renders a 1200x630 PNG", async () => {
    const { bytes } = await render("Concurrency in Java", "Blog")
    expect([...bytes.slice(0, 8)]).toEqual(PNG_SIGNATURE)
    expect(dimensions(bytes)).toEqual({ width: 1200, height: 630 })
  })

  it("serves it as an immutable PNG", async () => {
    const { response } = await render("Title", "Subtitle")
    expect(response.headers.get("Content-Type")).toBe("image/png")
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable")
  })

  it("changes with the title", async () => {
    const [first, second] = await Promise.all([render("One", "Blog"), render("Two", "Blog")])
    expect(first.bytes).not.toEqual(second.bytes)
  })

  it("changes with the subtitle", async () => {
    const [blog, project] = await Promise.all([render("Title", "Blog"), render("Title", "Project")])
    expect(blog.bytes).not.toEqual(project.bytes)
  })

  it("reads each font once for every image", async () => {
    vi.resetModules()
    const readFileSync = vi.spyOn(fs, "readFileSync")
    const { createOgImage: create } = await import("@/lib/og")
    await create("One", "Blog")
    await create("Two", "Blog")
    const fontReads = readFileSync.mock.calls.filter(([file]) => String(file).endsWith(".woff"))
    // Fraunces for the title, JetBrains Mono for the labels and Caveat for the handwriting
    expect(fontReads).toHaveLength(3)
    readFileSync.mockRestore()
  })
})
