// Remembers which Build Your Own lessons a visitor opened, in localStorage, and shows it wherever a course
// appears: its card, its page and the lesson trail. Each of those renders this inline right after its
// [data-byo-course] block, so the saved progress is drawn before the block first paints. The CSP allows it
// by hash: astro.config.mjs hashes this file.
//
// Storage: "byo-progress" → { [course]: { visited: [lesson slugs], last: lesson slug } }. Slugs are the
// same in every locale, so progress carries across languages.
//
// Inside a block:
//   [data-byo-visit="lesson"]   on the block: records a visit to that lesson (lesson pages)
//   [data-byo-stop="lesson"]    a lesson marker; gets data-visited and data-current (the last one opened)
//   [data-byo-continue]         a link sent to the last lesson opened, labelled data-label + its number
//   [data-byo-fresh]            shown only while there's no progress ("Start learning")
//   [data-byo-left-off="slug"]  shown only next to the last lesson opened
//   [data-byo-count]            "3/6 opened", from data-label and the block's data-byo-total
//   [data-byo-reset]            a button that forgets the course, shown once there's progress
;(() => {
  const key = "byo-progress"
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? "{}")
      return value && typeof value === "object" && !Array.isArray(value) ? value : {}
    } catch {
      return {}
    }
  }
  const write = all => {
    try {
      localStorage.setItem(key, JSON.stringify(all))
    } catch {
      // Storage can be blocked; progress then isn't remembered
    }
  }

  const render = block => {
    const course = block.dataset.byoCourse ?? ""
    const saved = read()[course]
    const visited = new Set(Array.isArray(saved?.visited) ? saved.visited : [])
    const stops = [...block.querySelectorAll("[data-byo-stop]")]
    const last = stops.find(stop => stop.dataset.byoStop === saved?.last)
    const opened = new Set(
      stops.map(stop => stop.dataset.byoStop).filter(slug => visited.has(slug))
    )

    block.toggleAttribute("data-has-progress", opened.size > 0)
    stops.forEach(stop => {
      stop.toggleAttribute("data-visited", visited.has(stop.dataset.byoStop))
      stop.toggleAttribute("data-current", stop === last)
    })
    block.querySelectorAll("[data-byo-fresh]").forEach(element => {
      element.hidden = Boolean(last)
    })
    block.querySelectorAll("[data-byo-left-off]").forEach(element => {
      element.hidden = !last || element.dataset.byoLeftOff !== last.dataset.byoStop
    })
    block.querySelectorAll("[data-byo-continue]").forEach(link => {
      link.hidden = !last
      if (!last) return
      link.href = last.dataset.href ?? last.getAttribute("href") ?? link.href
      const text = link.querySelector("[data-text]") ?? link
      text.textContent = `${link.dataset.label ?? ""} ${last.dataset.number ?? ""}`.trim()
    })
    block.querySelectorAll("[data-byo-reset]").forEach(element => {
      element.hidden = opened.size === 0
    })
    block.querySelectorAll("[data-byo-count]").forEach(element => {
      element.hidden = opened.size === 0
      element.textContent =
        `${opened.size}/${block.dataset.byoTotal ?? stops.length} ${element.dataset.label ?? ""}`.trim()
    })
  }

  const setUp = block => {
    const course = block.dataset.byoCourse
    const lesson = block.dataset.byoVisit
    if (course && lesson) {
      const all = read()
      const saved = all[course]
      const visited = new Set(Array.isArray(saved?.visited) ? saved.visited : [])
      visited.add(lesson)
      all[course] = { visited: [...visited], last: lesson }
      write(all)
    }
    block.querySelectorAll("[data-byo-reset]").forEach(button =>
      button.addEventListener("click", () => {
        const all = read()
        delete all[course ?? ""]
        write(all)
        render(block)
      })
    )
    render(block)
  }

  const previous = document.currentScript?.previousElementSibling
  if (previous?.matches("[data-byo-course]")) setUp(previous)
  else document.querySelectorAll("[data-byo-course]").forEach(setUp)
})()
