# devfolio

Source for [pyan.dev](https://www.pyan.dev), Daniel Benitez's multilingual developer portfolio. It's a
static, responsive site built with Astro, TypeScript, Tailwind CSS, and MDX, and it ships no React or
Next.js runtime.

## Features

- Home, work, projects, blog posts, and tag archive routes
- English, Spanish, and Brazilian Portuguese versions of every page
- MDX content collections with Zod frontmatter validation
- Client-side filtering, sorting, and pagination for lists
- Light, dark, and system theme modes
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
- Blog posts: `src/data/blog/<locale>/*.mdx`, with per-post metadata in `src/data/blog/metadata/`
- Work items: `src/data/work/*.mdx`
- Projects: `src/data/projects/*.mdx`

Astro loads all MDX content through `src/content.config.mjs`; dynamic pages, RSS, and generated SEO assets
are created at build time. [AGENTS.md](AGENTS.md) documents the full layout and conventions.

## Branches and deployments

| Branch      | Purpose                                        | Deploys to        |
| ----------- | ---------------------------------------------- | ----------------- |
| feature/... | One change, opened as a PR against `preview`   | Vercel preview    |
| `preview`   | Default branch; staging for the next release   | Vercel preview    |
| `main`      | Production; only accepts PRs from `preview`    | Vercel production |

See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute and [SECURITY.md](SECURITY.md) to report a
vulnerability.

## License

[MIT](LICENSE). The site started from an open-source Astro portfolio template by Alexandru Moraru; the
original copyright notice is kept in the license.
