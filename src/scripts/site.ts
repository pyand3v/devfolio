const ready = () => {
  const root = document.documentElement
  const toggle = document.querySelector<HTMLButtonElement>("#theme-toggle")
  const menu = document.querySelector<HTMLElement>("#theme-menu")
  const mobileToggle = document.querySelector<HTMLButtonElement>("#mobile-menu-toggle")
  const mobileMenu = document.querySelector<HTMLElement>("#mobile-menu")

  const applyTheme = (theme: string) => {
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    root.classList.toggle("dark", isDark)
    localStorage.setItem("theme", theme)
  }

  toggle?.addEventListener("click", event => {
    event.stopPropagation()
    const isOpen = menu?.classList.toggle("invisible") === false
    menu?.classList.toggle("opacity-0", !isOpen)
    toggle.setAttribute("aria-expanded", String(isOpen))
  })
  document
    .querySelectorAll<HTMLButtonElement>("[data-theme-mode]")
    .forEach(button =>
      button.addEventListener("click", () => applyTheme(button.dataset.themeMode ?? "system"))
    )
  document.querySelectorAll<HTMLButtonElement>("[data-accent]").forEach(button =>
    button.addEventListener("click", () => {
      const accent = button.dataset.accent ?? "blue"
      root.dataset.theme = accent
      localStorage.setItem("accent-theme", accent)
    })
  )
  document.addEventListener("click", event => {
    if (menu && !menu.contains(event.target as Node) && !toggle?.contains(event.target as Node)) {
      menu.classList.add("invisible", "opacity-0")
      toggle?.setAttribute("aria-expanded", "false")
    }
  })

  mobileToggle?.addEventListener("click", () => {
    const isOpen = mobileMenu?.classList.toggle("hidden") === false
    mobileToggle.setAttribute("aria-expanded", String(isOpen))
  })

  document.querySelectorAll<HTMLElement>("[data-locale-option]").forEach(option =>
    option.addEventListener("click", () => {
      localStorage.setItem("preferred-locale", option.dataset.localeOption ?? "en")
    })
  )

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

  const progress = document.querySelector<HTMLElement>("#scroll-progress")
  const crumbs = document.querySelector<HTMLElement>(".header-crumbs")
  const headerTitle = document.querySelector<HTMLElement>(".header-title")
  const detailPage = Boolean(headerTitle)
  const onScroll = () => {
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
    }
    if (detailPage && window.matchMedia("(max-width: 767px)").matches) {
      const showTitle = window.scrollY > 80
      crumbs?.classList.toggle("hidden", showTitle)
      headerTitle?.classList.toggle("hidden", !showTitle)
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true })
  onScroll()

  document.querySelectorAll<HTMLPreElement>(".prose pre").forEach(block => {
    if (block.parentElement?.classList.contains("code-block-wrapper")) return
    const wrapper = document.createElement("div")
    wrapper.className = "code-block-wrapper relative"
    block.before(wrapper)
    wrapper.append(block)
    const button = document.createElement("button")
    button.type = "button"
    button.className =
      "absolute right-2 top-2 rounded bg-gray-800 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
    button.textContent = "Copy"
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(block.innerText)
      button.textContent = "Copied"
      setTimeout(() => {
        button.textContent = "Copy"
      }, 1600)
    })
    wrapper.classList.add("group")
    wrapper.append(button)
  })
  document.querySelectorAll<HTMLImageElement>(".prose img").forEach(image =>
    image.addEventListener("click", () => {
      const dialog = document.createElement("dialog")
      dialog.className =
        "m-auto max-h-[95vh] max-w-[95vw] rounded-xl bg-transparent p-0 backdrop:bg-black/80"
      dialog.innerHTML = `<img src="${image.currentSrc}" alt="${image.alt}" class="max-h-[90vh] max-w-[90vw] rounded-xl" />`
      dialog.addEventListener("click", () => dialog.close())
      dialog.addEventListener("close", () => dialog.remove())
      document.body.append(dialog)
      dialog.showModal()
    })
  )
}

document.addEventListener("DOMContentLoaded", ready)
