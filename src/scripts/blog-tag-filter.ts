const filters = [...document.querySelectorAll<HTMLInputElement>(".blog-filter-input")]
const posts = [...document.querySelectorAll<HTMLElement>(".blog-post-item")]
const count = document.querySelector<HTMLElement>(".blog-filter-count")
const empty = document.querySelector<HTMLElement>(".blog-filter-empty")
const summary = document.querySelector<HTMLElement>(".blog-filter-summary")
const search = document.querySelector<HTMLInputElement>(".blog-filter-search")
const selection = document.querySelector<HTMLElement>(".blog-filter-selection")
const selected = document.querySelector<HTMLElement>(".blog-filter-selected")
const groups = [...document.querySelectorAll<HTMLElement>("[data-tag-group]")]
const noMatches = document.querySelector<HTMLElement>(".blog-filter-no-matches")
const clear = document.querySelector<HTMLButtonElement>(".blog-filter-clear")
const grid = document.querySelector<HTMLElement>(".blog-post-grid")
const resultsLabel = grid?.dataset.resultsLabel ?? "articles shown"
const resultLabel = grid?.dataset.resultLabel ?? resultsLabel

if (filters.length && posts.length) {
  const selectedTags = () =>
    (new URLSearchParams(window.location.search).get("tags") ?? "").split(",").filter(Boolean)

  const update = (tags: string[], replace = false) => {
    const url = new URL(window.location.href)
    tags.length ? url.searchParams.set("tags", tags.join(",")) : url.searchParams.delete("tags")
    url.searchParams.delete("tag")
    window.history[replace ? "replaceState" : "pushState"]({}, "", url)

    let visible = 0
    posts.forEach(post => {
      const matches =
        tags.length === 0 || tags.some(tag => (post.dataset.tags ?? "").split("|").includes(tag))
      post.toggleAttribute("hidden", !matches)
      if (matches) visible += 1
    })
    filters.forEach(filter => {
      filter.checked = tags.includes(filter.value)
    })
    renderDraft()
    if (summary)
      summary.textContent = tags.length
        ? `${tags.length} ${(tags.length === 1 && summary.dataset.selectedOneLabel) || summary.dataset.selectedLabel}`
        : (summary.dataset.allLabel ?? "All articles")
    if (count) count.textContent = `${visible} ${visible === 1 ? resultLabel : resultsLabel}`
    empty?.classList.toggle("hidden", visible !== 0)
  }

  const renderDraft = () => {
    const selectedTags = filters.filter(filter => filter.checked).map(filter => filter.value)
    selection?.classList.toggle("hidden", selectedTags.length === 0)
    if (selected) {
      selected.replaceChildren(
        ...selectedTags.map(tag => {
          const chip = document.createElement("button")
          chip.type = "button"
          chip.className =
            "inline-flex items-center gap-1 border border-[#d7df72]/55 px-2 py-1 text-[0.65rem] font-black tracking-[0.1em] text-[#d7df72] uppercase transition hover:border-[#e17669] hover:text-white"
          chip.textContent = `${tag} \u00d7`
          chip.setAttribute("aria-label", `${selection?.dataset.removeLabel ?? "Remove"} ${tag}`)
          chip.addEventListener("click", () => {
            const input = filters.find(filter => filter.value === tag)
            if (input) input.checked = false
            update(filters.filter(filter => filter.checked).map(filter => filter.value))
          })
          return chip
        })
      )
    }

    const query = search?.value.trim().toLowerCase() ?? ""
    let matchingOptions = 0
    filters.forEach(filter => {
      const option = filter.closest<HTMLElement>(".blog-filter-option")
      const matches = !query || filter.value.includes(query)
      option?.toggleAttribute("hidden", !matches)
      if (matches) matchingOptions += 1
    })
    groups.forEach(group => {
      group.toggleAttribute("hidden", !group.querySelector(".blog-filter-option:not([hidden])"))
    })
    noMatches?.classList.toggle("hidden", matchingOptions !== 0)
  }

  clear?.addEventListener("click", () => {
    if (search) search.value = ""
    update([])
  })
  filters.forEach(filter =>
    filter.addEventListener("change", () => {
      update(filters.filter(input => input.checked).map(input => input.value))
    })
  )
  search?.addEventListener("input", renderDraft)
  window.addEventListener("popstate", () => update(selectedTags(), true))
  update(selectedTags(), true)
}

// Bundled as an ES module by Astro; this also keeps its top-level names out of the global scope
export {}
