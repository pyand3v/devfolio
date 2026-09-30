// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest"
import type { Pagefind, PagefindResult } from "@/scripts/pagefind"

const loadPagefind = vi.hoisted(() => vi.fn<() => Promise<Pagefind>>())
vi.mock("@/scripts/pagefind", () => ({ loadPagefind }))

// The markup SearchPage.astro renders, trimmed to what search.ts reads
const fixture = `
  <form class="search-form" data-loading="Searching…" data-result="result for"
    data-results="results for" data-empty="No results for" data-unavailable="Search couldn't load.">
    <input name="q" type="search" />
  </form>
  <p class="search-status"></p>
  <ol class="search-results"></ol>
`

const result = (title: string, extra: Partial<PagefindResult> = {}): PagefindResult => ({
  url: `/blog/${title.toLowerCase()}/`,
  excerpt: `About <mark>${title}</mark>`,
  meta: { title, section: "Blog" },
  ...extra,
})

// A fake engine: each query maps to its results
function engine(index: Record<string, PagefindResult[]>): Pagefind {
  return {
    init: async () => {},
    search: async query =>
      query in index ? { results: index[query].map(data => ({ data: async () => data })) } : null,
  }
}

async function load(url = "/search") {
  window.history.replaceState({}, "", url)
  document.body.innerHTML = fixture
  vi.resetModules()
  await import("@/scripts/search")
}

const $ = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!
const input = () => $<HTMLInputElement>("input[name='q']")
const status = () => $(".search-status").textContent
const titles = () => [...document.querySelectorAll(".search-results h2")].map(h => h.textContent)
const settle = () => vi.waitFor(() => expect(status()).not.toBe("Searching…"))

describe("site search", () => {
  beforeEach(() => {
    loadPagefind.mockReset()
    loadPagefind.mockResolvedValue(
      engine({ java: [result("Java"), result("JVM")], css: [result("CSS")], none: [] })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does nothing until there's a query", async () => {
    await load()
    expect(status()).toBe("")
    expect(loadPagefind).not.toHaveBeenCalled()
  })

  it("runs the query from the URL on load and renders the results", async () => {
    await load("/search?q=java")
    expect(input().value).toBe("java")
    await settle()
    expect(status()).toBe("2 results for “java”")
    expect(titles()).toEqual(["Java", "JVM"])

    const link = $<HTMLAnchorElement>(".search-results a")
    expect(link.getAttribute("href")).toBe("/blog/java/")
    expect(link.querySelector("p")?.textContent).toBe("Blog")
    expect(link.querySelector("mark")?.textContent).toBe("Java")
  })

  it("uses the singular label for one result and says when nothing matches", async () => {
    await load("/search?q=css")
    await settle()
    expect(status()).toBe("1 result for “css”")

    await load("/search?q=none")
    await settle()
    expect(status()).toBe("No results for “none”")
    expect(titles()).toEqual([])
  })

  it("falls back to the URL and no section when a result has no metadata", async () => {
    loadPagefind.mockResolvedValue(engine({ bare: [result("Bare", { meta: {} })] }))
    await load("/search?q=bare")
    await settle()
    expect(titles()).toEqual(["/blog/bare/"])
    expect($(".search-results a").querySelector("p")?.textContent).toBe("About Bare")
  })

  it("searches as you type, debounced, and keeps the query in the URL", async () => {
    await load()
    vi.useFakeTimers()
    input().value = "c"
    input().dispatchEvent(new Event("input"))
    input().value = "css"
    input().dispatchEvent(new Event("input"))
    await vi.advanceTimersByTimeAsync(250)
    vi.useRealTimers()
    await settle()

    expect(titles()).toEqual(["CSS"])
    expect(window.location.search).toBe("?q=css")
  })

  it("searches on submit without reloading the page", async () => {
    await load()
    input().value = "  java  "
    const event = new Event("submit", { cancelable: true })
    $("form").dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    await settle()
    expect(status()).toBe("2 results for “java”")
  })

  it("clears the results and the URL when the query is emptied", async () => {
    await load("/search?q=java")
    await settle()
    input().value = ""
    $("form").dispatchEvent(new Event("submit", { cancelable: true }))
    await vi.waitFor(() => expect(titles()).toEqual([]))
    expect(status()).toBe("")
    expect(window.location.search).toBe("")
  })

  it("only shows the latest query's results", async () => {
    let release = () => {}
    const slow = new Promise<void>(resolve => (release = resolve))
    const fast = engine({ css: [result("CSS")] })
    loadPagefind.mockResolvedValue({
      init: async () => {},
      search: async query => {
        if (query === "java") await slow
        return fast.search(query)
      },
    })
    await load("/search?q=java")
    input().value = "css"
    $("form").dispatchEvent(new Event("submit", { cancelable: true }))
    await vi.waitFor(() => expect(titles()).toEqual(["CSS"]))
    release()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(titles()).toEqual(["CSS"])
  })

  it("says search is unavailable when the index can't load", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    loadPagefind.mockRejectedValue(new Error("404"))
    await load("/search?q=java")
    await settle()
    expect(status()).toBe("Search couldn't load.")
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it("starts loading the index when the box gets focus, once", async () => {
    await load()
    input().dispatchEvent(new Event("focus"))
    input().dispatchEvent(new Event("focus"))
    await vi.waitFor(() => expect(loadPagefind).toHaveBeenCalledTimes(1))
  })
})
