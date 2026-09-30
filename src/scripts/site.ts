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

  const progress = document.querySelector<HTMLElement>("#scroll-progress")
  const onScroll = () => {
    if (!progress) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
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
      // Built with DOM properties, not innerHTML, so alt text can't break out of the attribute
      const zoomed = document.createElement("img")
      zoomed.src = image.currentSrc || image.src
      zoomed.alt = image.alt
      zoomed.className = "max-h-[90vh] max-w-[90vw] rounded-xl"
      dialog.append(zoomed)
      dialog.addEventListener("click", () => dialog.close())
      dialog.addEventListener("close", () => dialog.remove())
      document.body.append(dialog)
      dialog.showModal()
    })
  )
}

document.addEventListener("DOMContentLoaded", ready)

// Bundled as an ES module by Astro; this also keeps its top-level names out of the global scope
export {}
