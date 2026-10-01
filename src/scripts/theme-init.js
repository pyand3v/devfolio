// Picks the color theme before the page paints, so it's rendered inline and synchronously in <head> (see
// BaseLayout). The CSP allows it by hash: astro.config.mjs hashes this file. A stored choice wins, else the
// system preference. The "js" class lets CSS hold scroll-triggered animations until src/scripts/site.ts
// plays them; without JavaScript they simply run on load.
;(() => {
  const root = document.documentElement
  root.classList.add("js")
  let theme = ""
  try {
    theme = localStorage.getItem("theme") ?? ""
  } catch {
    // Storage can be blocked; the system preference still applies
  }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  root.dataset.theme = theme
  // Until the stylesheet applies, the browser paints its own canvas in the system's scheme, which flashes
  // when the chosen theme differs. Paint the theme's paper color from the start; site.ts hands it back to
  // the stylesheet once loaded. Keep these in step with --paper in src/styles/globals.css.
  root.style.colorScheme = theme
  root.style.backgroundColor = theme === "dark" ? "#0e1a33" : "#f7f5ef"
})()
