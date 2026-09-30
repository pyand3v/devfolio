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
| Scaffold content / PR   | `pnpm content <command>` (see `docs/CONTENT.md`)        |
| Internal link check     | `pnpm links:check` (after `pnpm build`)                 |
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
- `src/pages/admin/` + `public/admin/index.html` — the Sveltia CMS at `/admin`: its config (`config.yml`, built
  from `src/lib/cms-config.ts`) and its script, served from the installed `@sveltia/cms` package.
- `src/layouts/BaseLayout.astro` — the single page shell: SEO/meta tags, JSON-LD, header/footer, analytics.
- `src/components/` — `.astro` components; MDX-specific components in `src/components/mdx/`.
- `src/scripts/` — small client-side TypeScript (filtering, theme, galleries).
- `src/lib/` — shared logic: `content.ts` (collection queries), `i18n.ts` (locales and all UI copy),
  `schemas.ts` (the content model: Zod schemas and the fields each entry takes from its path),
  `content-files.ts` (helpers for the `pnpm content` CLI), `cms-config.ts` (Sveltia CMS collections),
  `dates.ts`, `utils.ts`, `og.ts` (satori + resvg OG images), `constants.ts`.
- `src/content.config.mjs` — content collections, loaded by a custom recursive MDX loader that adds the
  path-derived fields (locale, slug, BYO course) before validation.
- `src/data/` — content and site config:
  - `site.ts` (site metadata/SEO), `portfolio.ts` (profile, navigation), `blog-tags.ts`
  - `blog/<locale>/<slug>.mdx`, `work/<slug>.mdx`, `projects/<slug>.mdx`
  - `byo/<locale>/<course>/` — "Build Your Own" courses: `project.mdx` plus one file per lesson, guide and
    exercise
- `scripts/content-check.mjs` — pre-build validation: every file against the schemas, plus translations,
  BYO lesson order and referenced images.
- `scripts/content.mjs` — the `pnpm content` CLI: scaffolds entries, copies images, opens content PRs.
- `tests/` — Vitest unit tests (Node environment) for `src/lib`.
- `docs/SEO.md` — SEO setup notes.
- `docs/CONTENT.md` — how content is structured and how to write it (CMS, CLI or by hand).

The `@/` import alias maps to `src/`.

## Conventions

- **i18n**: locales are `en`, `es`, `pt-br`. All user-facing UI strings go in `copy` in `src/lib/i18n.ts` for
  every locale; never hard-code English text in components. A blog post is one file per language with the
  same file name; the `en` file is required and holds the fields translations share (`publishedAt`,
  `updatedAt`, `featured`). Content is written by people: the tooling scaffolds and validates, it never
  generates text.
- **Content schemas**: `src/lib/schemas.ts` is the single source of truth, used by the Astro loader,
  `scripts/content-check.mjs` and the CLI. The file path supplies `locale`, `slug` and the BYO course, so
  frontmatter doesn't repeat them. If you change a schema, update `src/lib/cms-config.ts` (a test checks the
  CMS fields match) and existing content in the same change. `schemas.ts`, `content-files.ts`, `dates.ts`
  and `i18n.ts` run directly in Node, so they may only use relative imports and erasable TypeScript.
- **Styling**: Tailwind utilities plus the Nord design tokens in `src/styles/globals.css` (the palette is
  intentionally fixed, not theme-switchable). Use Astro's `class:list` for conditional classes. Pages must
  work at phone width without horizontal scroll.
- **Formatting**: Prettier — no semicolons, double quotes, 2 spaces, 100-char lines, `arrowParens: avoid`.
  MDX, `docs/` and `.github/` are Prettier-ignored.
- **Tests**: add or update Vitest tests in `tests/lib/` when changing logic in `src/lib/`.
- **Env**: `PUBLIC_SITE_URL` sets the canonical origin (defaults to the Vercel URL). Never commit `.env*`.

## Git and pull requests

- Branch flow: feature branch → `preview` → `main`. `preview` is the default branch and the staging
  environment; `main` is production. Never commit or push directly to either: both are protected (a PR plus
  passing Lint & Format, Tests and Build checks), and only admins may bypass that. Work on a branch
  (`feat/…`, `fix/…`, `chore/…`, `docs/…`, or the branch your session was started on) and open a PR against
  `preview` (squash merge). The **Promote** workflow then keeps a `chore: promote preview to main` PR open
  that lists what production is missing. Releasing is merging that PR, with a merge commit (not squash, or
  the two branches' histories diverge), once `preview` looks good on its Vercel deployment. Don't open
  promotion PRs by hand. The Promotion Source check rejects PRs into `main` from any other branch. After a
  release `main` has one merge commit `preview` lacks; that's expected and needs no sync.
- Dependabot PRs into `preview` auto-merge (squash) once checks pass, except major version updates, which need
  a manual review. Promote's daily run adds those merges to the release PR.
- PR titles follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`,
  with a lowercase imperative summary, no trailing period, ideally under 72 characters (e.g.
  `feat(blog): add tag filter`, `fix(i18n): translate 404 page`, `chore(deps): bump astro`). Types: `feat`,
  `fix`, `content`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`; the scope
  is optional (`blog`, `work`, `byo`, `i18n`, `seo`, `deps`, `ci`, ...), and `!` before the colon marks a
  breaking change. The **PR Title** check enforces this, and squash merges into `preview` use the title as
  the commit.
- Use the same format for commit subjects (e.g. `feat(landing): add localized slogan`).
- Every push deploys through `.github/workflows/deploy-vercel.yml`: `main` to production (`pyan.dev`), any
  other branch to a new Vercel preview URL. The URL shows as "View deployment" on the commit and its PR,
  and under Deployments on the repo page.
- Fill in `.github/pull_request_template.md`: summary, type of change, checklist, and screenshots for any UI
  change (desktop and mobile).
- CI on every PR (`.github/workflows/`): the PR title format, Prettier, ESLint, `astro check`, Vitest with a coverage comment, a
  production build with an internal link check, Lighthouse budgets, a Vercel preview deployment, and a one-time Claude review when the PR opens (skipped for
  content/docs-only PRs and for `preview` → `main` promotions). All checks must pass before merging. Commenting `@claude` on an issue or PR asks
  Claude to respond or push a fix; `@claude review` requests another review.
- There are no versioned releases or tags: every promotion merged into `main` deploys to production on
  Vercel, and the commit history is the changelog. Don't bump the version in `package.json`.
