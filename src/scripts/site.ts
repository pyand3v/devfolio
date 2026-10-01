const root = document.documentElement
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Storage can be blocked; the choice then lasts for this page only
    }
  },
}

// theme-init.js picked the theme before paint; this keeps the toggle and the system preference in step
const setUpTheme = () => {
  const toggle = document.querySelector<HTMLButtonElement>("#theme-toggle")
  const system = window.matchMedia("(prefers-color-scheme: dark)")
  const label = () => {
    if (!toggle) return
    const dark = root.dataset.theme === "dark"
    toggle.setAttribute(
      "aria-label",
      (dark ? toggle.dataset.labelLight : toggle.dataset.labelDark) ?? toggle.ariaLabel ?? ""
    )
  }
  const apply = (theme: "light" | "dark") => {
    root.dataset.theme = theme
    label()
  }
  // theme-init.js painted the canvas before the stylesheet loaded; the stylesheet takes over from here
  root.style.removeProperty("background-color")
  root.style.removeProperty("color-scheme")
  label()
  toggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark"
    storage.set("theme", next)
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown }
    if (doc.startViewTransition && !reducedMotion()) doc.startViewTransition(() => apply(next))
    else apply(next)
  })
  // Until the visitor picks a theme, follow the system as it changes
  system.addEventListener?.("change", event => {
    if (!storage.get("theme")) apply(event.matches ? "dark" : "light")
  })
}

// Animations inside [data-animate] and on [data-reveal] wait, paused by CSS, until they scroll into view
const setUpInView = () => {
  const targets = [...document.querySelectorAll<HTMLElement>("[data-animate], [data-reveal]")]
  if (!("IntersectionObserver" in window)) {
    targets.forEach(target => target.classList.add("in-view"))
    return
  }
  const observer = new IntersectionObserver(
    entries =>
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("in-view")
        observer.unobserve(entry.target)
      }),
    { rootMargin: "0px 0px -8% 0px" }
  )
  targets.forEach(target => observer.observe(target))
}

// Ctrl K, ⌘ K or "/" opens search, or focuses it when already there
const setUpSearchShortcut = () => {
  const link = document.querySelector<HTMLAnchorElement>("[data-search-link]")
  document.addEventListener("keydown", event => {
    const target = event.target as HTMLElement | null
    const typing =
      target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
    const shortcut =
      (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) ||
      (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey)
    if (!shortcut) return
    const input = document.querySelector<HTMLInputElement>("#search-input")
    event.preventDefault()
    if (input) input.focus()
    else if (link) link.click()
  })
}

const setUpReadingProgress = () => {
  const progress = document.querySelector<HTMLElement>("#scroll-progress")
  const readout = document.querySelector<HTMLElement>("#scroll-progress-label")
  const toc = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")]
  const headings = toc
    .map(link => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter((heading): heading is HTMLElement => Boolean(heading))

  let queued = false
  const update = () => {
    queued = false
    const max = document.documentElement.scrollHeight - window.innerHeight
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    if (progress) progress.style.transform = `scaleX(${ratio})`
    if (readout) {
      const filled = Math.round(ratio * 10)
      readout.textContent = `[${"#".repeat(filled)}${"-".repeat(10 - filled)}] ${Math.round(ratio * 100)}%`
    }
    if (headings.length) {
      // The current section is the last heading above the top quarter of the screen
      const line = window.innerHeight * 0.25
      let current = -1
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= line) current = index
      })
      toc.forEach((link, index) => {
        const item = link.closest("li")
        item?.toggleAttribute("data-active", index === current)
        item?.toggleAttribute("data-read", index < current)
        if (index === current) link.setAttribute("aria-current", "location")
        else link.removeAttribute("aria-current")
      })
    }
  }
  const onScroll = () => {
    if (queued) return
    queued = true
    window.requestAnimationFrame(update)
  }
  window.addEventListener("scroll", onScroll, { passive: true })
  update()
}

// Code blocks become terminal windows: a title bar with the language and a copy button
const setUpCodeBlocks = () => {
  const copyLabel = document.body.dataset.copyLabel ?? "Copy"
  const copiedLabel = document.body.dataset.copiedLabel ?? "Copied"
  document.querySelectorAll<HTMLPreElement>(".prose pre").forEach(block => {
    if (block.parentElement?.classList.contains("code-block-wrapper")) return
    const wrapper = document.createElement("div")
    wrapper.className = "code-block-wrapper code-block not-prose"
    const bar = document.createElement("div")
    bar.className = "terminal-bar rounded-t-lg"
    for (let dot = 0; dot < 3; dot++) {
      const span = document.createElement("span")
      span.className = "dot"
      span.setAttribute("aria-hidden", "true")
      bar.append(span)
    }
    const language = document.createElement("span")
    language.className = "ml-1.5"
    language.textContent = block.dataset.language ?? ""
    const button = document.createElement("button")
    button.type = "button"
    button.className =
      "ml-auto rounded px-2 py-0.5 font-mono text-xs text-code-muted transition hover:bg-white/10 hover:text-code-fg"
    button.textContent = copyLabel
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(block.innerText)
      button.textContent = copiedLabel
      setTimeout(() => {
        button.textContent = copyLabel
      }, 1600)
    })
    bar.append(language, button)
    block.before(wrapper)
    wrapper.append(bar, block)
  })
}

const setUpImageZoom = () => {
  document.querySelectorAll<HTMLImageElement>(".prose img").forEach(image =>
    image.addEventListener("click", () => {
      const dialog = document.createElement("dialog")
      dialog.className =
        "m-auto max-h-[95vh] max-w-[95vw] bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      // Built with DOM properties, not innerHTML, so alt text can't break out of the attribute
      const zoomed = document.createElement("img")
      zoomed.src = image.currentSrc || image.src
      zoomed.alt = image.alt
      zoomed.className = "max-h-[90vh] max-w-[90vw] rounded-md"
      dialog.append(zoomed)
      dialog.addEventListener("click", () => dialog.close())
      dialog.addEventListener("close", () => dialog.remove())
      document.body.append(dialog)
      dialog.showModal()
    })
  )
}

const ready = () => {
  const mobileToggle = document.querySelector<HTMLButtonElement>("#mobile-menu-toggle")
  const mobileMenu = document.querySelector<HTMLElement>("#mobile-menu")

  mobileToggle?.addEventListener("click", () => {
    const isOpen = mobileMenu?.classList.toggle("hidden") === false
    mobileToggle.setAttribute("aria-expanded", String(isOpen))
  })

  document.querySelectorAll<HTMLElement>("[data-locale-option]").forEach(option =>
    option.addEventListener("click", () => {
      localStorage.setItem("preferred-locale", option.dataset.localeOption ?? "en")
    })
  )

  // Keeps visitors in their preferred locale when they follow internal links written without a prefix
  document.addEventListener("click", event => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]")
    if (
      !anchor ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      anchor.target ||
      anchor.origin !== window.location.origin
    )
      return
    const preferred = localStorage.getItem("preferred-locale") ?? "en"
    if (preferred === "en" || !["es", "pt-br"].includes(preferred)) return
    const path = anchor.pathname.replace(/^\/(es|pt-br)(?=\/|$)/, "") || "/"
    event.preventDefault()
    window.location.assign(`/${preferred}${path}${anchor.search}${anchor.hash}`)
  })

  setUpTheme()
  setUpInView()
  setUpSearchShortcut()
  setUpReadingProgress()
  setUpCodeBlocks()
  setUpImageZoom()
}

document.addEventListener("DOMContentLoaded", ready)

// Bundled as an ES module by Astro; this also keeps its top-level names out of the global scope
export {}
