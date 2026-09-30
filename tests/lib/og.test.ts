import { describe, it, expect } from "vitest"
import { createOgImage } from "@/lib/og"

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

async function render(title: string, subtitle: string, theme?: string) {
  const response = await createOgImage(title, subtitle, theme)
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

  it("uses the requested theme and falls back to blue for unknown ones", async () => {
    const [blue, rose, unknown] = await Promise.all([
      render("Title", "Blog", "blue"),
      render("Title", "Blog", "rose"),
      render("Title", "Blog", "not-a-theme"),
    ])
    expect(rose.bytes).not.toEqual(blue.bytes)
    expect(unknown.bytes).toEqual(blue.bytes)
  })
})
