const setupBrowser = (browser: HTMLElement) => {
  const param = browser.dataset.param ?? "tags"
  const pageSize = Number(browser.dataset.pageSize ?? 6)
  const itemsRoot = browser.nextElementSibling as HTMLElement | null
  if (!itemsRoot || itemsRoot.dataset.collectionItems !== browser.dataset.collection) return
  const filters = [...browser.querySelectorAll<HTMLInputElement>(".collection-filter")]
  const search = browser.querySelector<HTMLInputElement>(".collection-search")
  const sort = browser.querySelector<HTMLSelectElement>(".collection-sort")
  const apply = browser.querySelector<HTMLButtonElement>(".collection-apply")
  const clear = browser.querySelector<HTMLButtonElement>(".collection-clear")
  const active = browser.querySelector<HTMLElement>(".collection-active-filters")
  const empty = browser.querySelector<HTMLElement>(".collection-empty")
  const pagination = browser.querySelector<HTMLElement>(".collection-pagination")
  const resultCount = browser.querySelector<HTMLElement>(".collection-result-count")
  const viewButtons = [...browser.querySelectorAll<HTMLButtonElement>(".collection-view")]
  const allItems = [...itemsRoot.querySelectorAll<HTMLElement>(".collection-item")]

  const values = () => new URLSearchParams(window.location.search)
  const selected = () => values().get(param)?.split(",").filter(Boolean) ?? []
  const updateUrl = (next: URLSearchParams, replace = false) =>
    window.history[replace ? "replaceState" : "pushState"](
      {},
      "",
      `${window.location.pathname}${next.toString() ? `?${next}` : ""}`
    )

  const render = () => {
    const params = values()
    const selectedValues = selected()
    const sortValue = params.get("sort") ?? ""
    const query = params.get("q")?.trim().toLowerCase() ?? ""
    const view = params.get("view") === "compact" ? "compact" : "grid"
    const page = Math.max(1, Number(params.get("page") ?? 1))
    filters.forEach(input => {
      input.checked = selectedValues.includes(input.value)
    })
    if (sort) sort.value = sortValue
    if (search) search.value = query
    itemsRoot.classList.toggle("collection-compact", view === "compact")
    viewButtons.forEach(button => {
      const activeView = button.dataset.view === view
      button.setAttribute("aria-pressed", String(activeView))
      button.classList.toggle("bg-accent-500", activeView)
      button.classList.toggle("text-white", activeView)
      button.classList.toggle("shadow-sm", activeView)
    })
    const visible = allItems.filter(item => {
      const itemValues = (item.dataset.values ?? "").split("|").filter(Boolean)
      const matchesFilter =
        selectedValues.length === 0 || selectedValues.some(value => itemValues.includes(value))
      return matchesFilter && (!query || (item.dataset.search ?? "").includes(query))
    })
    const direction = sortValue === "asc" || sortValue === "oldest" ? 1 : -1
    visible.sort(
      (a, b) => direction * (a.dataset.sortKey ?? "").localeCompare(b.dataset.sortKey ?? "")
    )
    visible.forEach(item => itemsRoot.append(item))
    const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
    const safePage = Math.min(page, totalPages)
    allItems.forEach(item => item.classList.add("hidden"))
    visible
      .slice((safePage - 1) * pageSize, safePage * pageSize)
      .forEach(item => item.classList.remove("hidden"))
    empty?.classList.toggle("hidden", visible.length !== 0)
    if (resultCount) {
      const label = browser.dataset.collection === "blog" ? "articles" : "results"
      const rangeStart = visible.length === 0 ? 0 : (safePage - 1) * pageSize + 1
      const rangeEnd = Math.min(safePage * pageSize, visible.length)
      resultCount.textContent = `Showing ${rangeStart}–${rangeEnd} of ${visible.length} ${label}`
    }
    if (active) {
      active.replaceChildren(
        ...[
          ...selectedValues.map(value => ({
            label: value,
            remove: () => {
              const next = values()
              const remaining = selected().filter(entry => entry !== value)
              remaining.length ? next.set(param, remaining.join(",")) : next.delete(param)
              next.delete("page")
              updateUrl(next)
              render()
            },
          })),
          ...(query
            ? [
                {
                  label: `Search: ${query}`,
                  remove: () => {
                    const next = values()
                    next.delete("q")
                    next.delete("page")
                    updateUrl(next)
                    render()
                  },
                },
              ]
            : []),
        ].map(({ label, remove }) => {
          const button = document.createElement("button")
          button.type = "button"
          button.textContent = `${label} ×`
          button.className =
            "rounded-full bg-accent-500 px-3 py-1 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600"
          button.addEventListener("click", remove)
          return button
        })
      )
    }
    if (pagination) {
      pagination.replaceChildren(
        ...Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1
          const link = document.createElement("button")
          link.type = "button"
          link.textContent = String(pageNumber)
          link.className = `size-9 rounded-md border font-semibold transition ${pageNumber === safePage ? "border-accent-500 bg-accent-500 text-white" : "border-gray-300 hover:border-accent-500 dark:border-gray-700"}`
          link.addEventListener("click", () => {
            const next = values()
            pageNumber === 1 ? next.delete("page") : next.set("page", String(pageNumber))
            updateUrl(next)
            render()
            window.scrollTo({ top: 0, behavior: "smooth" })
          })
          return link
        })
      )
    }
  }
  apply?.addEventListener("click", () => {
    const next = values()
    const checked = filters.filter(input => input.checked).map(input => input.value)
    checked.length ? next.set(param, checked.join(",")) : next.delete(param)
    next.delete("page")
    updateUrl(next)
    render()
  })
  clear?.addEventListener("click", () => {
    filters.forEach(input => {
      input.checked = false
    })
    const next = values()
    next.delete(param)
    next.delete("page")
    updateUrl(next)
    render()
  })
  sort?.addEventListener("change", () => {
    const next = values()
    sort.value ? next.set("sort", sort.value) : next.delete("sort")
    next.delete("page")
    updateUrl(next)
    render()
  })
  search?.addEventListener("input", () => {
    const next = values()
    const value = search.value.trim()
    value ? next.set("q", value) : next.delete("q")
    next.delete("page")
    updateUrl(next, true)
    render()
  })
  viewButtons.forEach(button => {
    button.addEventListener("click", () => {
      const next = values()
      button.dataset.view === "compact" ? next.set("view", "compact") : next.delete("view")
      updateUrl(next)
      render()
    })
  })
  window.addEventListener("popstate", render)
  render()
}

document.querySelectorAll<HTMLElement>(".collection-browser").forEach(setupBrowser)
