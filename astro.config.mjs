import mdx from "@astrojs/mdx"
import tailwindcss from "@tailwindcss/vite"
import icon from "astro-icon"
import { defineConfig } from "astro/config"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const site = process.env.PUBLIC_SITE_URL ?? "https://nextjs-portofolio-website.vercel.app"

// BaseLayout renders this file inline, so the CSP allows it by the hash of the exact same bytes
const localeRedirect = readFileSync(new URL("./src/scripts/locale-redirect.js", import.meta.url))
const localeRedirectHash = `sha256-${createHash("sha256").update(localeRedirect).digest("base64")}`

export default defineConfig({
  site,
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "pt-br"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [mdx(), icon()],
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
        resources: ["'self'", "https://va.vercel-scripts.com"],
        hashes: [localeRedirectHash],
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
