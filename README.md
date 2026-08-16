# Astro Developer Portfolio Template

A static, responsive developer portfolio built with Astro, TypeScript, Tailwind CSS, and MDX. It preserves the original portfolio’s pages, filtering, theme controls, metadata, feeds, and generated Open Graph images while shipping no React or Next.js runtime.

## Features

- Home, work, projects, blog posts, and tag archive routes
- MDX content collections with Zod frontmatter validation
- Client-side filtering, sorting, and pagination for lists
- Light/dark mode and persistent accent-color picker
- Responsive navigation, scroll progress, galleries, code-copy controls, and image lightboxes
- Static RSS, robots, sitemap, `llms.txt`, JSON-LD, and Open Graph image endpoints
- Vercel Analytics and Speed Insights through their Astro integrations

## Development

```bash
pnpm install
pnpm dev
```

Run the project checks with:

```bash
pnpm format:check
pnpm lint:check
pnpm types:check
pnpm test
pnpm build
```

## Content and configuration

- Site metadata: `src/data/site.ts`
- Portfolio details/navigation: `src/data/portfolio.ts`
- Blog posts: `src/data/blog/*.mdx`
- Work items: `src/data/work/*.mdx`
- Projects: `src/data/projects/*.mdx`

Astro discovers all MDX content through `src/content.config.ts`; dynamic pages, RSS, and generated SEO assets are created at build time.
