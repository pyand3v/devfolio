// Shows the 404 page in the visitor's language: the locale they chose (stored by the inline locale
// redirect), else the one in the URL, else English.
const blocks = [...document.querySelectorAll<HTMLElement>("[data-not-found]")]

if (blocks.length) {
  let stored: string | null = null
  try {
    stored = localStorage.getItem("preferred-locale")
  } catch {
    // Storage can be blocked; the URL still says something
  }
  const fromPath = window.location.pathname.split("/").filter(Boolean)[0]
  const pick = (value?: string | null) =>
    blocks.find(block => value && block.dataset.notFound === value)
  const shown = pick(stored) ?? pick(fromPath) ?? blocks[0]
  const english = blocks[0].dataset.title ?? ""

  blocks.forEach(block => block.toggleAttribute("hidden", block !== shown))
  document.documentElement.lang = shown.dataset.notFound ?? "en"
  document.title = document.title.replace(english, shown.dataset.title ?? english)
}

export {}
