// @vitest-environment happy-dom
import { beforeEach, describe, it, expect, vi } from "vitest"

// The markup blog-tag-filter.ts expects, trimmed to what it reads
const fixture = `
  <p class="blog-filter-summary" data-all-label="All articles" data-selected-one-label="topic selected" data-selected-label="topics selected"></p>
  <input class="blog-filter-search" />
  <div class="blog-filter-selection hidden" data-remove-label="Remove"><div class="blog-filter-selected"></div></div>
  <div data-tag-group="frontend">
    <label class="blog-filter-option"><input type="checkbox" class="blog-filter-input" value="css" /></label>
  </div>
  <div data-tag-group="java">
    <label class="blog-filter-option"><input type="checkbox" class="blog-filter-input" value="java" /></label>
    <label class="blog-filter-option"><input type="checkbox" class="blog-filter-input" value="jvm" /></label>
  </div>
  <p class="blog-filter-no-matches hidden"></p>
  <button class="blog-filter-clear"></button>
  <p class="blog-filter-count"></p>
  <p class="blog-filter-empty hidden"></p>
  <ul class="blog-post-grid" data-result-label="article shown" data-results-label="articles shown">
    <li class="blog-post-item" data-tags="css|frontend">CSS</li>
    <li class="blog-post-item" data-tags="java|jvm">JVM</li>
    <li class="blog-post-item" data-tags="java">Java</li>
  </ul>
`

async function load(url = "/blog") {
  window.history.replaceState({}, "", url)
  document.body.innerHTML = fixture
  vi.resetModules()
  await import("@/scripts/blog-tag-filter")
}

const $ = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!
const visiblePosts = () =>
  [...document.querySelectorAll<HTMLElement>(".blog-post-item")]
    .filter(post => !post.hidden)
    .map(post => post.textContent)
const filter = (value: string) => $<HTMLInputElement>(`.blog-filter-input[value="${value}"]`)
const toggle = (value: string) => {
  filter(value).checked = !filter(value).checked
  filter(value).dispatchEvent(new Event("change"))
}

describe("blog tag filter", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("shows every post when no tags are selected", async () => {
    await load()
    expect(visiblePosts()).toEqual(["CSS", "JVM", "Java"])
    expect($(".blog-filter-count").textContent).toBe("3 articles shown")
    expect($(".blog-filter-summary").textContent).toBe("All articles")
  })

  it("applies the tags from the URL on load", async () => {
    await load("/blog?tags=jvm")
    expect(visiblePosts()).toEqual(["JVM"])
    expect(filter("jvm").checked).toBe(true)
    expect($(".blog-filter-summary").textContent).toBe("1 topic selected")
    expect($(".blog-filter-count").textContent).toBe("1 article shown")
  })

  it("filters posts matching any selected tag and records them in the URL", async () => {
    await load()
    toggle("css")
    toggle("jvm")
    expect(visiblePosts()).toEqual(["CSS", "JVM"])
    expect(new URL(window.location.href).searchParams.get("tags")).toBe("css,jvm")
    expect($(".blog-filter-summary").textContent).toBe("2 topics selected")
    expect($(".blog-filter-count").textContent).toBe("2 articles shown")
    expect($(".blog-filter-selection").classList.contains("hidden")).toBe(false)
    expect([...$(".blog-filter-selected").children].map(chip => chip.textContent)).toEqual([
      "css ×",
      "jvm ×",
    ])
  })

  it("removes a tag when its chip is clicked", async () => {
    await load("/blog?tags=css,jvm")
    $<HTMLButtonElement>('.blog-filter-selected button[aria-label="Remove css"]').click()
    expect(visiblePosts()).toEqual(["JVM"])
    expect(filter("css").checked).toBe(false)
  })

  it("narrows the tag options by search and hides empty groups", async () => {
    await load()
    const search = $<HTMLInputElement>(".blog-filter-search")
    search.value = "jv"
    search.dispatchEvent(new Event("input"))
    expect(filter("jvm").closest<HTMLElement>(".blog-filter-option")!.hidden).toBe(false)
    expect(filter("java").closest<HTMLElement>(".blog-filter-option")!.hidden).toBe(true)
    expect($('[data-tag-group="frontend"]').hidden).toBe(true)

    search.value = "nothing"
    search.dispatchEvent(new Event("input"))
    expect($(".blog-filter-no-matches").classList.contains("hidden")).toBe(false)
  })

  it("clears the search and every selected tag", async () => {
    await load("/blog?tags=css")
    $<HTMLInputElement>(".blog-filter-search").value = "c"
    $<HTMLButtonElement>(".blog-filter-clear").click()
    expect(visiblePosts()).toEqual(["CSS", "JVM", "Java"])
    expect($<HTMLInputElement>(".blog-filter-search").value).toBe("")
    expect(new URL(window.location.href).searchParams.has("tags")).toBe(false)
  })

  it("shows the empty state when no post matches", async () => {
    await load("/blog?tags=unknown")
    expect(visiblePosts()).toEqual([])
    expect($(".blog-filter-empty").classList.contains("hidden")).toBe(false)
    expect($(".blog-filter-count").textContent).toBe("0 articles shown")
  })
})
