// Redirects to the visitor's preferred locale before the page paints, so it's rendered inline and
// synchronously in <head> (see BaseLayout). The CSP allows it by hash: astro.config.mjs hashes this file.
;(() => {
  const key = "preferred-locale"
  const supported = ["en", "es", "pt-br"]
  const detectLocale = () => {
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
    return languages.find(value => value?.toLowerCase().startsWith("pt"))
      ? "pt-br"
      : languages.find(value => value?.toLowerCase().startsWith("es"))
        ? "es"
        : "en"
  }
  let preferred = ""
  try {
    preferred = localStorage.getItem(key) ?? ""
    if (!supported.includes(preferred)) {
      preferred = detectLocale()
      localStorage.setItem(key, preferred)
    }
  } catch {
    preferred = detectLocale()
  }
  const segments = window.location.pathname.split("/").filter(Boolean)
  const current = supported.includes(segments[0]) ? segments.shift() || "en" : "en"
  const logicalPath = `/${segments.join("/")}`.replace(/\/$/, "") || "/"
  if (current === preferred) {
    if (current !== "en")
      history.replaceState(
        null,
        "",
        `${logicalPath}${window.location.search}${window.location.hash}`
      )
    return
  }
  if ((segments[0] === "work" || segments[0] === "projects") && segments.length > 1) {
    segments.splice(1)
  }
  const path = `/${[preferred === "en" ? "" : preferred, ...segments].filter(Boolean).join("/")}`
  const destination = `${path || "/"}${window.location.search}${window.location.hash}`
  if (
    destination !== `${window.location.pathname}${window.location.search}${window.location.hash}`
  ) {
    window.location.replace(destination)
  }
})()
