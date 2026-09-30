// Loads Pagefind's browser bundle, which the build writes to /pagefind/ (see astro.config.mjs). search.ts
// imports this module dynamically, which keeps Astro from inlining the search script into the page: Vite's
// preload helper for the import below only works in an emitted chunk.

export type PagefindResult = {
  url: string
  excerpt: string
  meta: { title?: string; section?: string }
}

export type Pagefind = {
  init: () => Promise<void>
  search: (query: string) => Promise<{
    results: Array<{ data: () => Promise<PagefindResult> }>
  } | null>
}

// A variable, so Vite leaves the import alone: the bundle only exists in the build output
const bundlePath = "/pagefind/pagefind.js"

export async function loadPagefind(): Promise<Pagefind> {
  const pagefind: Pagefind = await import(/* @vite-ignore */ bundlePath)
  await pagefind.init()
  return pagefind
}
