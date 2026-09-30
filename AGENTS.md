# devfolio

Static, multilingual developer portfolio built with Astro 7, TypeScript (strict), Tailwind CSS 4 and MDX.
Deployed to Vercel (production from `main`, a preview for every other branch). No React/Next.js runtime.

## Astro guidance

- Before changing routes, MDX/content collections, integrations, or configuration, read the version-matched
  docs shipped with the installed `astro` package (`node_modules/astro/`) and use current Astro conventions.
- Every public page is statically rendered. Don't add server rendering, adapters, or `prerender = false`
  unless a request explicitly requires it.
- Keep interactive behavior in small client-side scripts (`src/scripts/`) or Astro islands.

## Commands

Package manager is **pnpm** (v11, Node 24). Don't use npm/yarn or create other lockfiles.

| Task                    | Command                                                 |
| ----------------------- | ------------------------------------------------------- |
| Install                 | `pnpm install`                                          |
| Dev server (port 4321)  | `pnpm dev`                                              |
| Production build        | `pnpm build` (runs `content:check`, then Astro build)   |
| Content validation only | `pnpm content:check`                                    |
| Format check / fix      | `pnpm format:check` / `pnpm format:write`               |
| Lint check (0 warnings) | `pnpm lint:check`                                       |
| Type check              | `pnpm types:check`                                      |
| Tests / single file     | `pnpm test` / `pnpm vitest run tests/lib/utils.test.ts` |
| Coverage                | `pnpm test:coverage`                                    |

Before calling a change done, run the same gates CI runs:

```bash
pnpm format:check && pnpm lint:check && pnpm types:check && pnpm test && pnpm build
```

Husky runs `lint-staged` on commit (ESLint + Prettier check on staged files) and `pnpm test` on push. Never
bypass them with `--no-verify`; fix the underlying issue instead.

## Layout

- `src/pages/` — routes. The default locale (`en`) lives at the root (`/blog`, `/work`, ...), and
  `src/pages/[locale]/` mirrors it for `es` and `pt-br` via `getStaticPaths`. When adding or changing a route,
  update both trees. List and detail routes have a sibling `opengraph-image.ts` endpoint that renders a PNG
  at build time.
- `src/pages/*.ts` — static endpoints: `rss.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`.
- `src/layouts/BaseLayout.astro` — the single page shell: SEO/meta tags, JSON-LD, header/footer, analytics.
- `src/components/` — `.astro` components; MDX-specific components in `src/components/mdx/`.
- `src/scripts/` — small client-side TypeScript (filtering, theme, galleries).
- `src/lib/` — shared logic: `content.ts` (collection queries), `i18n.ts` (locales and all UI copy),
  `schemas.ts` (Zod frontmatter schemas), `utils.ts`, `og.ts` (satori + resvg OG images), `constants.ts`.
- `src/content.config.mjs` — content collections, loaded by a custom recursive MDX loader.
- `src/data/` — content and site config:
  - `site.ts` (site metadata/SEO), `portfolio.ts` (profile, navigation), `blog-tags.ts`
  - `blog/<locale>/*.mdx` + `blog/metadata/*.mdx` (per-post slug, dates, languages, featured flag)
  - `work/*.mdx` + `metadata/work/`, `projects/*.mdx` + `metadata/projects/`
  - `byo/<locale>/<project>/` — "Build Your Own" courses (`project`, `lesson-NN`, `guide`, `exercise`)
- `scripts/content-check.mjs` — pre-build validation of blog metadata, slugs and translations.
- `tests/` — Vitest unit tests (Node environment) for `src/lib`.
- `docs/SEO.md` — SEO setup notes.

The `@/` import alias maps to `src/`.

## Conventions

- **i18n**: locales are `en`, `es`, `pt-br`. All user-facing UI strings go in `copy` in `src/lib/i18n.ts` for
  every locale; never hard-code English text in components. A blog post is one `metadata/<post>.mdx` plus
  one file per language listed in its `availableLanguages`, all sharing a `translationKey`.
- **Content schemas**: frontmatter is validated by Zod in `src/content.config.mjs`. If you change a schema,
  update `src/lib/schemas.ts`, `scripts/content-check.mjs` and existing content in the same change.
- **Styling**: Tailwind utilities plus the Nord design tokens in `src/styles/globals.css` (the palette is
  intentionally fixed, not theme-switchable). Use Astro's `class:list` for conditional classes. Pages must
  work at phone width without horizontal scroll.
- **Formatting**: Prettier — no semicolons, double quotes, 2 spaces, 100-char lines, `arrowParens: avoid`.
  MDX, `docs/` and `.github/` are Prettier-ignored.
- **Tests**: add or update Vitest tests in `tests/lib/` when changing logic in `src/lib/`.
- **Env**: `PUBLIC_SITE_URL` sets the canonical origin (defaults to the Vercel URL). Never commit `.env*`.

## Git and pull requests

- Never commit directly to `main`. Work on a branch (`feat/…`, `fix/…`, `chore/…`, `docs/…`, or the branch
  your session was started on) and open a PR against `main`. Never push to `main` either: it's protected
  (a PR plus passing Lint & Format, Tests and Build checks), and only admins and the Prepare Release
  workflow may bypass that.
- PR titles follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`,
  with a lowercase imperative summary, no trailing period, ideally under 72 characters (e.g.
  `feat(blog): add tag filter`, `fix(i18n): translate 404 page`, `chore(deps): bump astro`). Types: `feat`,
  `fix`, `content`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`; the scope
  is optional (`blog`, `work`, `byo`, `i18n`, `seo`, `deps`, `ci`, ...), and `!` before the colon marks a
  breaking change. The **PR Title** check enforces this, and squash merges use the title as the commit.
- Use the same format for commit subjects (e.g. `feat(landing): add localized slogan`). `chore(release):` is
  reserved for the Prepare Release workflow.
- Fill in `.github/pull_request_template.md`: summary, type of change, checklist, and screenshots for any UI
  change (desktop and mobile).
- CI on every PR (`.github/workflows/`): the PR title format, Prettier, ESLint, `astro check`, Vitest with a coverage comment, a
  production build, a Vercel preview deployment, and a one-time Claude review when the PR opens (skipped for
  content/docs-only PRs). All checks must pass before merging. Commenting `@claude` on an issue or PR asks
  Claude to respond or push a fix; `@claude review` requests another review.
- Releases are cut from `main` with the manual **Prepare Release** workflow (bumps `package.json`, tags
  `vX.Y.Z`), which triggers **Build & Release**. Don't bump the version in feature PRs.
