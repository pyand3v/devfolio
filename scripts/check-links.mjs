// Checks every internal link in the built site: each href, src and srcset on every page must resolve to a
// file in dist/, and each #fragment must match an id (or name) on the target page. So must each page's
// canonical URL, Open Graph image and hreflang alternates. External links aren't
// checked, since their availability isn't ours to gate on. Run after `pnpm build`.
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

const dist = path.resolve(import.meta.dirname, "..", "dist")
const external = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(entry => {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) return htmlFiles(file)
      return entry.name.endsWith(".html") ? [file] : []
    })
  )
  return nested.flat()
}

const isFile = file =>
  stat(file).then(
    info => info.isFile(),
    () => false
  )

// Maps a URL path to the file serving it: /blog -> blog/index.html or blog.html, /rss.xml -> rss.xml
async function resolveTarget(pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, "")
  const base = path.join(dist, relative)
  if (!base.startsWith(dist)) return null
  for (const candidate of [base, path.join(base, "index.html"), `${base}.html`]) {
    if (await isFile(candidate)) return candidate
  }
  return null
}

const pageUrl = file => {
  const relative = path.relative(dist, file).split(path.sep).join("/")
  return `/${relative.replace(/(^|\/)index\.html$/, "$1")}`
}

const idCache = new Map()
async function anchorsOf(file) {
  if (!idCache.has(file)) {
    const html = await readFile(file, "utf8")
    const ids = new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map(match => match[1]))
    idCache.set(file, ids)
  }
  return idCache.get(file)
}

const references = page => {
  // Script bodies can contain attribute-like strings (e.g. HTML templates) that aren't links
  const html = page.replace(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, match =>
    match.slice(0, match.indexOf(">") + 1)
  )
  const values = [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map(match => match[1])
  for (const [, srcset] of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    values.push(...srcset.split(",").map(entry => entry.trim().split(/\s+/)[0]))
  }
  return values
    .map(value => value.replaceAll("&amp;", "&"))
    .filter(value => value && !external.test(value))
}

// Links are locale-neutral by design (see getLocalizedPath): on /es/ and /pt-br/ pages, src/scripts/site.ts
// sends a click on /blog/x to /es/blog/x. So an unprefixed link resolves to the page's locale first.
const localePrefix = /^\/(es|pt-br)(?=\/|$)/

async function resolveLink(pathname, fromPathname) {
  const locale = fromPathname.match(localePrefix)?.[1]
  if (locale && !localePrefix.test(pathname)) {
    const localized = await resolveTarget(`/${locale}${pathname}`)
    if (localized) return localized
  }
  return resolveTarget(pathname)
}

// The canonical URL, the Open Graph image and the hreflang alternates are absolute URLs on the site's own
// origin, which the canonical of the home page gives. They must resolve exactly, with no locale fallback.
const seoUrls = page => [
  ...[...page.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(match => match[1]),
  ...[...page.matchAll(/<meta property="og:image" content="([^"]+)"/g)].map(match => match[1]),
  ...[...page.matchAll(/<link rel="alternate" hreflang="[^"]+" href="([^"]+)"/g)].map(m => m[1]),
]
const siteOrigin = seoUrls(await readFile(path.join(dist, "index.html"), "utf8"))
  .map(value => new URL(value).origin)
  .at(0)

const pages = await htmlFiles(dist)
const broken = []
let checked = 0

for (const page of pages) {
  const html = await readFile(page, "utf8")
  const from = new URL(pageUrl(page), "http://site.invalid")
  for (const value of new Set(seoUrls(html))) {
    checked += 1
    const url = new URL(value)
    if (url.origin !== siteOrigin || !(await resolveTarget(url.pathname))) {
      broken.push(
        `${pageUrl(page)} -> ${value} (canonical, og:image or hreflang with no such page)`
      )
    }
  }
  for (const reference of new Set(references(html))) {
    checked += 1
    const url = new URL(reference, from)
    const target =
      url.pathname === from.pathname && reference.startsWith("#")
        ? page
        : await resolveLink(url.pathname, from.pathname)
    if (!target) {
      broken.push(`${pageUrl(page)} -> ${reference} (no such file)`)
      continue
    }
    const fragment = decodeURIComponent(url.hash.slice(1))
    if (fragment && target.endsWith(".html") && !(await anchorsOf(target)).has(fragment)) {
      broken.push(`${pageUrl(page)} -> ${reference} (no element with id "${fragment}")`)
    }
  }
}

if (broken.length) {
  console.error(`Found ${broken.length} broken internal links:\n- ${broken.join("\n- ")}`)
  process.exit(1)
}
console.log(`Checked ${checked} internal links across ${pages.length} pages; none are broken.`)
