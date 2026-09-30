// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, it, expect, vi, type Mock } from "vitest"

const fixture = `
  <div id="scroll-progress"></div>
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
      <pre>const answer = 42</pre>
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

  it("sets the scroll progress bar", () => {
    expect($("#scroll-progress").style.transform).toMatch(/^scaleX\(/)
  })
})
