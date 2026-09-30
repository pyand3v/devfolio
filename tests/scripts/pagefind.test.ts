import { describe, it, expect, vi } from "vitest"

// The bundle only exists in dist/ after a build, so it's stood in for here
const init = vi.hoisted(() => vi.fn(async () => {}))
vi.mock("/pagefind/pagefind.js", () => ({ init, search: vi.fn() }))

describe("loadPagefind", () => {
  it("imports the built bundle and initialises it before returning it", async () => {
    const { loadPagefind } = await import("@/scripts/pagefind")
    const pagefind = await loadPagefind()
    expect(init).toHaveBeenCalledOnce()
    expect(pagefind.init).toBe(init)
  })
})
