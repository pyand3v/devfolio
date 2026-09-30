// Static search over the Pagefind index that the build writes to /pagefind/ (see astro.config.mjs). Pagefind
// picks the index for the page's <html lang>, so each locale searches its own content.

import type { Pagefind, PagefindResult } from "@/scripts/pagefind"

const MAX_RESULTS = 20
const DEBOUNCE_MS = 200

const form = document.querySelector<HTMLFormElement>(".search-form")
const input = form?.querySelector<HTMLInputElement>("input[name='q']")
const status = document.querySelector<HTMLElement>(".search-status")
const list = document.querySelector<HTMLOListElement>(".search-results")

let engine: Promise<Pagefind | undefined> | undefined
const loadEngine = () =>
  (engine ??= import("@/scripts/pagefind")
    .then(({ loadPagefind }) => loadPagefind())
    .catch((error: unknown) => {
      console.warn("Search index unavailable. It is built by `pnpm build`.", error)
      return undefined
    }))

const renderResult = ({ url, excerpt, meta }: PagefindResult) => {
  const item = document.createElement("li")
  const link = document.createElement("a")
  link.href = url
  link.className =
    "block border border-white/20 bg-white/[0.03] p-5 transition hover:border-[#88c0d0] hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#88c0d0]"
  if (meta.section) {
    const section = document.createElement("p")
    section.className = "font-mono text-xs font-bold tracking-[0.14em] text-[#8fbcbb] uppercase"
    section.textContent = meta.section
    link.append(section)
  }
  const title = document.createElement("h2")
  title.className = "mt-2 text-xl font-bold text-white"
  title.textContent = meta.title ?? url
  // Pagefind escapes the page text and only adds <mark> around the matches
  const snippet = document.createElement("p")
  snippet.className =
    "mt-2 text-sm leading-relaxed text-white/75 [&_mark]:bg-[#ebcb8b] [&_mark]:px-0.5 [&_mark]:text-[#2e3440]"
  snippet.innerHTML = excerpt
  link.append(title, snippet)
  item.append(link)
  return item
}

if (form && input && status && list) {
  const labels = form.dataset
  let latest = 0

  const run = async (rawQuery: string) => {
    const query = rawQuery.trim()
    const current = ++latest
    const url = new URL(window.location.href)
    if (query) url.searchParams.set("q", query)
    else url.searchParams.delete("q")
    window.history.replaceState(null, "", url)

    if (!query) {
      list.replaceChildren()
      status.textContent = ""
      return
    }
    status.textContent = labels.loading ?? ""
    const pagefind = await loadEngine()
    if (current !== latest) return
    if (!pagefind) {
      status.textContent = labels.unavailable ?? ""
      return
    }
    const search = await pagefind.search(query)
    const results = search?.results ?? []
    const data = await Promise.all(results.slice(0, MAX_RESULTS).map(result => result.data()))
    if (current !== latest) return

    list.replaceChildren(...data.map(renderResult))
    status.textContent = results.length
      ? `${results.length} ${results.length === 1 ? labels.result : labels.results} “${query}”`
      : `${labels.empty} “${query}”`
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  input.addEventListener("input", () => {
    clearTimeout(timer)
    timer = setTimeout(() => run(input.value), DEBOUNCE_MS)
  })
  form.addEventListener("submit", event => {
    event.preventDefault()
    clearTimeout(timer)
    run(input.value)
  })

  const initial = new URLSearchParams(window.location.search).get("q") ?? ""
  if (initial) {
    input.value = initial
    run(initial)
  }
  // Start fetching the index early; the first query then only waits for the matching fragments
  input.addEventListener("focus", () => loadEngine(), { once: true })
}

export {}
