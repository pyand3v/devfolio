// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi, type Mock } from "vitest"

const fixture = `
  <button id="theme-toggle" data-label-dark="Dark" data-label-light="Light"></button>
  <div id="scroll-progress"></div>
  <p id="scroll-progress-label"></p>
  <a id="search" href="/search" data-search-link>Search</a>
  <ol>
    <li><a href="#first" data-toc-link>First</a></li>
    <li><a href="#second" data-toc-link>Second</a></li>
  </ol>
  <button id="mobile-menu-toggle" aria-expanded="false"></button>
  <nav id="mobile-menu" class="hidden">
    <a href="/es" data-locale-option="es">ES</a>
  </nav>
  <main>
    <a id="internal" href="/blog/post?x=1#top">Post</a>
    <a id="prefixed" href="/pt-br/work">Work</a>
    <a id="external" href="https://example.com/">External</a>
    <a id="new-tab" href="/blog" target="_blank">New tab</a>
    <article class="prose">
      <h2 id="first">First</h2>
      <h2 id="second">Second</h2>
      <pre data-language="ts">const answer = 42</pre>
      <img src="/cover.png" alt='Diagram "quoted" &lt;b&gt;' />
    </article>
  </main>
`

let assign: Mock<(url: string | URL) => void>

// site.ts adds listeners to document and window, which outlive a test. Record them so each test
// removes its own and a re-import doesn't run every earlier copy of the script too.
const cleanups: (() => void)[] = []
function trackListeners(target: EventTarget) {
  const add = target.addEventListener.bind(target)
  vi.spyOn(target, "addEventListener").mockImplementation((type, listener, options) => {
    cleanups.push(() => target.removeEventListener(type, listener, options))
    add(type, listener, options)
  })
}

async function load() {
  document.body.innerHTML = fixture
  trackListeners(document)
  trackListeners(window)
  vi.resetModules()
  await import("@/scripts/site")
  document.dispatchEvent(new Event("DOMContentLoaded"))
}

const $ = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!
const click = (element: Element, init: MouseEventInit = {}) =>
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }))

describe("site script", () => {
  beforeEach(async () => {
    localStorage.clear()
    document.documentElement.dataset.theme = "light"
    assign = vi.fn<(url: string | URL) => void>()
    vi.spyOn(window.location, "assign").mockImplementation(assign)
    await load()
  })

  afterEach(() => {
    cleanups.splice(0).forEach(cleanup => cleanup())
    vi.restoreAllMocks()
  })

  it("toggles the mobile menu", () => {
    click($("#mobile-menu-toggle"))
    expect($("#mobile-menu").classList.contains("hidden")).toBe(false)
    expect($("#mobile-menu-toggle").getAttribute("aria-expanded")).toBe("true")
    click($("#mobile-menu-toggle"))
    expect($("#mobile-menu").classList.contains("hidden")).toBe(true)
    expect($("#mobile-menu-toggle").getAttribute("aria-expanded")).toBe("false")
  })

  it("remembers the locale picked in the menu", () => {
    click($("[data-locale-option]"))
    expect(localStorage.getItem("preferred-locale")).toBe("es")
  })

  describe("internal links", () => {
    it("are rewritten to the preferred locale", () => {
      localStorage.setItem("preferred-locale", "es")
      click($("#internal"))
      expect(assign).toHaveBeenCalledWith("/es/blog/post?x=1#top")
    })

    it("swap an existing locale prefix", () => {
      localStorage.setItem("preferred-locale", "es")
      click($("#prefixed"))
      expect(assign).toHaveBeenCalledWith("/es/work")
    })

    it("are left alone for English, new tabs, modifier clicks and other sites", () => {
      click($("#internal"))
      localStorage.setItem("preferred-locale", "pt-br")
      click($("#external"))
      click($("#new-tab"))
      click($("#internal"), { ctrlKey: true })
      click($("#internal"), { button: 1 })
      expect(assign).not.toHaveBeenCalled()
    })
  })

  it("adds a copy button to code blocks", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
    const button = $(".code-block-wrapper button")
    expect(button.textContent).toBe("Copy")
    click(button)
    await vi.waitFor(() => expect(button.textContent).toBe("Copied"))
    expect(writeText).toHaveBeenCalledWith("const answer = 42")
  })

  it("opens images in a dialog without interpreting their alt text as HTML", async () => {
    click($(".prose img"))
    const dialog = $<HTMLDialogElement>("dialog")
    const zoomed = dialog.querySelector("img")!
    expect(zoomed.alt).toBe('Diagram "quoted" <b>')
    expect(dialog.querySelector("b")).toBeNull()
    // The dialog's close event fires asynchronously
    click(dialog)
    await vi.waitFor(() => expect(document.querySelector("dialog")).toBeNull())
  })

  it("sets the scroll progress bar and its readout", () => {
    expect($("#scroll-progress").style.transform).toMatch(/^scaleX\(/)
    expect($("#scroll-progress-label").textContent).toMatch(/^\[[#-]{10}\] \d+%$/)
  })

  describe("theme toggle", () => {
    it("names the theme it switches to", () => {
      expect($("#theme-toggle").getAttribute("aria-label")).toBe("Dark")
    })

    it("switches the theme and remembers the choice", () => {
      click($("#theme-toggle"))
      expect(document.documentElement.dataset.theme).toBe("dark")
      expect(localStorage.getItem("theme")).toBe("dark")
      expect($("#theme-toggle").getAttribute("aria-label")).toBe("Light")
      click($("#theme-toggle"))
      expect(document.documentElement.dataset.theme).toBe("light")
      expect(localStorage.getItem("theme")).toBe("light")
    })
  })

  it("opens search with Ctrl K", () => {
    const followed = vi.fn((event: Event) => event.preventDefault())
    $("#search").addEventListener("click", followed)
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))
    expect(followed).toHaveBeenCalledOnce()
  })

  it("labels code blocks with their language", () => {
    expect($(".code-block-wrapper .terminal-bar").textContent).toContain("ts")
  })

  it("marks the section being read in the outline", async () => {
    vi.spyOn($("#first"), "getBoundingClientRect").mockReturnValue({ top: -50 } as DOMRect)
    vi.spyOn($("#second"), "getBoundingClientRect").mockReturnValue({ top: 900 } as DOMRect)
    window.dispatchEvent(new Event("scroll"))
    await vi.waitFor(() =>
      expect($('[href="#first"]').getAttribute("aria-current")).toBe("location")
    )
    expect($('[href="#first"]').closest("li")!.hasAttribute("data-active")).toBe(true)
    expect($('[href="#second"]').closest("li")!.hasAttribute("data-active")).toBe(false)
  })
})
