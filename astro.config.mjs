import mdx from "@astrojs/mdx"
import tailwindcss from "@tailwindcss/vite"
import icon from "astro-icon"
import { defineConfig } from "astro/config"
import { createHash } from "node:crypto"
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs"
import { extname, join, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const site = process.env.PUBLIC_SITE_URL ?? "https://nextjs-portofolio-website.vercel.app"

// These scripts are rendered inline (BaseLayout, and the BYO components for byo-progress.js), so the CSP
// allows them by the hash of the exact same bytes
const inlineScriptHash = path =>
  `sha256-${createHash("sha256")
    .update(readFileSync(new URL(path, import.meta.url)))
    .digest("base64")}`
const localeRedirectHash = inlineScriptHash("./src/scripts/locale-redirect.js")
const themeInitHash = inlineScriptHash("./src/scripts/theme-init.js")
const byoProgressHash = inlineScriptHash("./src/scripts/byo-progress.js")

// Pagefind's files that aren't binary data (its index and WebAssembly files are)
const pagefindTypes = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
}

/**
 * Indexes the built pages with Pagefind once the build is done, for the static search at /search. Only
 * elements marked data-pagefind-body are indexed (blog posts, work, projects and BYO), with one index per
 * <html lang>. The dev server has no built pages to index, so it serves the index from the last build.
 * @returns {import("astro").AstroIntegration}
 */
const pagefind = () => {
  let outDir = new URL("./dist/", import.meta.url)
  return {
    name: "pagefind",
    hooks: {
      "astro:config:done": ({ config }) => {
        outDir = config.outDir
      },
      "astro:server:setup": ({ server, logger }) => {
        const root = resolve(fileURLToPath(new URL("pagefind/", outDir)))
        if (!existsSync(root)) {
          logger.warn(
            "No search index yet, so /search can't find anything. Run `pnpm build` once to make one."
          )
        }
        server.middlewares.use("/pagefind", (request, response, next) => {
          let file = ""
          try {
            file = join(root, decodeURIComponent((request.url ?? "/").split("?")[0]))
          } catch {
            // A malformed escape in the URL: not one of Pagefind's files
          }
          if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile())
            return next()
          response.setHeader(
            "Content-Type",
            pagefindTypes[extname(file)] ?? "application/octet-stream"
          )
          createReadStream(file)
            // A rebuild can remove the file mid-request
            .on("error", () => (response.headersSent ? response.destroy() : next()))
            .pipe(response)
        })
      },
      "astro:build:done": async ({ dir, logger }) => {
        const { createIndex, close } = await import("pagefind")
        const { index, errors } = await createIndex()
        if (!index) throw new Error(`Pagefind: ${errors.join("\n")}`)
        const added = await index.addDirectory({ path: fileURLToPath(dir) })
        if (added.errors.length) throw new Error(`Pagefind: ${added.errors.join("\n")}`)
        const written = await index.writeFiles({
          outputPath: fileURLToPath(new URL("pagefind/", dir)),
        })
        if (written.errors.length) throw new Error(`Pagefind: ${written.errors.join("\n")}`)
        await close()
        logger.info(`Indexed ${added.page_count} pages for search`)
      },
    },
  }
}

export default defineConfig({
  site,
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "pt-br"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [mdx(), icon(), pagefind()],
  markdown: {
    // github-dark (the default) renders comments below the 4.5:1 contrast WCAG AA asks for
    shikiConfig: { theme: "github-dark-default" },
  },
  // Emits a CSP <meta> on every page with hashes for the scripts and styles Astro renders, so neither needs
  // 'unsafe-inline'. frame-ancestors can't be set from a <meta>; vercel.json sends it as a header.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ],
      scriptDirective: {
        // Pagefind's search runs as WebAssembly
        resources: ["'self'", "https://va.vercel-scripts.com", "'wasm-unsafe-eval'"],
        hashes: [localeRedirectHash, themeInitHash, byoProgressHash],
      },
      styleDirective: {
        // Syntax-highlighted code blocks use inline style attributes
        resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }],
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
})
