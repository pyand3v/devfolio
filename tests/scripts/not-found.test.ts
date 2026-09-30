// @vitest-environment happy-dom
import { beforeEach, describe, it, expect, vi } from "vitest"

const fixture = `
  <div data-not-found="en" data-title="Page not found">Page not found</div>
  <div data-not-found="es" data-title="Página no encontrada" hidden>Página no encontrada</div>
  <div data-not-found="pt-br" data-title="Página não encontrada" hidden>Página não encontrada</div>
`

async function load(url: string, stored?: string) {
  window.history.replaceState({}, "", url)
  localStorage.clear()
  if (stored) localStorage.setItem("preferred-locale", stored)
  document.documentElement.lang = "en"
  document.title = "Page not found | Site"
  document.body.innerHTML = fixture
  vi.resetModules()
  await import("@/scripts/not-found")
}

const visible = () =>
  [...document.querySelectorAll<HTMLElement>("[data-not-found]")]
    .filter(block => !block.hidden)
    .map(block => block.dataset.notFound)

describe("not-found page", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("stays in English by default", async () => {
    await load("/missing")
    expect(visible()).toEqual(["en"])
    expect(document.documentElement.lang).toBe("en")
    expect(document.title).toBe("Page not found | Site")
  })

  it("uses the stored locale, and translates the language and title", async () => {
    await load("/missing", "es")
    expect(visible()).toEqual(["es"])
    expect(document.documentElement.lang).toBe("es")
    expect(document.title).toBe("Página no encontrada | Site")
  })

  it("falls back to the locale in the URL", async () => {
    await load("/pt-br/missing")
    expect(visible()).toEqual(["pt-br"])
  })

  it("prefers the stored locale over the URL and ignores unknown values", async () => {
    await load("/pt-br/missing", "es")
    expect(visible()).toEqual(["es"])
    await load("/missing", "fr")
    expect(visible()).toEqual(["en"])
  })

  it("still works when storage is blocked", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    await load("/es/missing")
    expect(visible()).toEqual(["es"])
    getItem.mockRestore()
  })

  it("does nothing on other pages", async () => {
    window.history.replaceState({}, "", "/es/blog")
    document.body.innerHTML = "<main></main>"
    document.title = "Blog"
    vi.resetModules()
    await import("@/scripts/not-found")
    expect(document.title).toBe("Blog")
  })
})
