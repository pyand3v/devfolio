import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import icon from "astro-icon"
import { defineConfig } from "astro/config"
import { fileURLToPath } from "node:url"

const site = process.env.PUBLIC_SITE_URL ?? "https://nextjs-portofolio-website.vercel.app"

export default defineConfig({
  site,
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "pt-br"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [mdx(), sitemap(), icon()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
})
