# devfolio

Source for [pyan.dev](https://www.pyan.dev), Daniel Benitez's static, multilingual developer portfolio, built with Astro, TypeScript, Tailwind CSS, and MDX, and deployed on Vercel. Every page is rendered at build time and ships no React or Next.js runtime.

## Features

- Home, work, projects, blog (with tag archives), and "Build Your Own" (BYO) course routes
- Three languages: English (`en`, the default), Spanish (`es`), and Brazilian Portuguese (`pt-br`)
- MDX content collections with Zod frontmatter validation and a pre-build content check
- Client-side filtering, sorting, and pagination for lists
- A fixed Nord color palette, responsive navigation, scroll progress, galleries, code-copy controls, and image lightboxes
- Static RSS, robots, sitemap, `llms.txt`, JSON-LD, and Open Graph image endpoints
- Vercel Analytics and Speed Insights

## Development

Requires Node.js 24 and pnpm 11.

```bash
pnpm install
pnpm dev
```

Run the same checks CI runs with:

```bash
pnpm format:check && pnpm lint:check && pnpm types:check && pnpm test && pnpm build
```

## Languages

English pages live at the root (`/blog`, `/work`, ...). `src/pages/[locale]/` mirrors those routes for `es` and `pt-br` (`/es/blog`, `/pt-br/blog`, ...). Links are rendered without a locale prefix; the language switcher saves the visitor's choice, and `src/scripts/site.ts` adds the matching prefix when a link is clicked.

All UI text lives in `copy` in `src/lib/i18n.ts`, with one entry per locale.

## Content and configuration

- Site metadata and SEO: `src/data/site.ts`
- Profile and navigation: `src/data/portfolio.ts`
- Blog posts: `src/data/blog/<locale>/<slug>.mdx`, one file per language; the `en` file holds the dates and featured flag
- Work items: `src/data/work/<slug>.mdx`
- Projects: `src/data/projects/<slug>.mdx`, with images in `public/projects/<slug>/`
- BYO courses: `src/data/byo/<locale>/<course>/` (a `project.mdx` entry plus one file per lesson, guide, and exercise)

Content is written by people. To add it, use the CMS at `/admin`, the `pnpm content` CLI, or edit the files directly; see [docs/CONTENT.md](docs/CONTENT.md).

Collections are defined in `src/content.config.mjs` and validated by the schemas in `src/lib/schemas.ts`. `pnpm build` runs `scripts/content-check.mjs` first to validate every entry, its translations, and the images it references. Dynamic pages, feeds, and SEO assets are generated at build time; see [docs/SEO.md](docs/SEO.md).

## Branches and deployments

| Branch      | Purpose                                       | Deploys to        |
| ----------- | --------------------------------------------- | ----------------- |
| feature/... | One change, opened as a PR against `preview`  | Vercel preview    |
| `preview`   | Default branch; staging for the next release  | Vercel preview    |
| `main`      | Production; only accepts PRs from `preview`   | Vercel production |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a vulnerability, follow [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE). The site started from an open-source Astro portfolio template by Alexandru Moraru; the original copyright notice is kept in the license.
