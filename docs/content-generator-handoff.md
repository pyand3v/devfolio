# Handoff: research a content generator for devfolio

**For:** an AI agent doing research and design only. Don't build anything yet.
**Deliverable:** a recommendation doc (see "What to produce" at the end), not code.
**Repo:** `pyand3v/devfolio`, the source of https://pyan.dev. Read `AGENTS.md` first. It covers the stack,
layout, conventions and Git flow.

## Goal

Find the best way to help the owner produce content for this site faster: blog posts, their `es` / `pt-br`
translations, "Build Your Own" (BYO) courses, and project/work entries. Every output must be valid and
consistent with the site's schemas, and must reach the site through the normal PR flow.

Answer three questions:

1. **What already exists?** Tools, products, open-source projects, Astro integrations, or agent workflows
   that already do this, or most of it.
2. **What's the best implementation for this repo?** Compare options: a CLI script, a Claude Code skill or
   subagent, a GitHub Action or issue template, a headless CMS or Git-based CMS with AI assistance, or an
   MCP server. Weigh cost, maintenance, quality control and fit with the existing workflow.
3. **Where should the human stay in the loop?** Decide this explicitly (see the next section).

## Constraint to resolve first: "human-generated content"

The GitHub repo description says: *"My devfolio featuring human-generated content, built with Claude and
Codex."* A generator that writes posts end to end would contradict that public claim. The research has to
recommend a position and a design that honors it. Possible positions:

- **Assistive only:** the owner writes, and the tool handles scaffolding, frontmatter, metadata, slugs, tags,
  translation drafts, summaries, linting and PR creation.
- **Draft and rewrite:** the tool drafts from the owner's notes or outline, and the owner rewrites and approves.
- **Disclosed generation:** some content is AI-generated and labeled as such. That needs a schema field and UI
  (for example `aiAssisted: true`) and a change to the repo description.

Treat translations separately. Machine-drafted `es` / `pt-br` versions of a human-written post, reviewed by
the owner, may be acceptable where AI-written originals aren't. Present the tradeoffs; don't pick silently.

## How content works today

All content is MDX in `src/data/`, validated at build time by Zod schemas in `src/content.config.mjs`, and
again by `scripts/content-check.mjs`, which runs before every build.

| Type           | Files                                                                                  | Notes                                                                                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Blog post      | `src/data/blog/metadata/<key>.mdx` + `src/data/blog/<locale>/<key>.mdx` for each locale | The metadata file holds `slug`, `availableLanguages`, `fallbackLanguage`, `featured`, `publishedAt`, `updatedAt`. Each localized file holds `locale`, `translationKey` (= `<key>`), `title`, `summary`, `tags`, and the body. Some posts exist only in `en`. |
| BYO course     | `src/data/byo/<locale>/<project>/{project,lesson-NN,guide,exercise}.mdx`                | Discriminated union on `type`. Every entry must exist in all 3 locales. Lesson `order` must be contiguous. Exercises need `difficulty`.                                                                                                                      |
| Project        | `src/data/projects/<Name>.mdx` + `src/data/metadata/projects/<name>.mdx`                | Metadata has `slug` and `assetKey`. Gallery images live in `public/projects/<assetKey>/`.                                                                                                                                                                    |
| Work           | `src/data/work/<Company>.mdx` + `src/data/metadata/work/<company>.mdx`                  | Role, dates, locations, tech stack.                                                                                                                                                                                                                          |
| Blog tags      | `src/data/blog-tags.ts`                                                                 | Tag list and colors.                                                                                                                                                                                                                                         |
| UI text        | `src/lib/i18n.ts`                                                                       | All interface text for every locale. Content must not add UI strings anywhere else.                                                                                                                                                                         |

Other details that matter for a generator:

- **Locales:** `en` (default, served at the root), `es`, `pt-br`. Routes are generated from content, so new
  content needs no code changes.
- **Build-time outputs:** each list and detail page gets an Open Graph image rendered at build time by
  `src/lib/og.ts`. RSS, the sitemap and `llms.txt` are also generated from content.
- **Validation you can reuse:** `pnpm content:check` and `pnpm build` are the source of truth for "is this
  content valid". A generator should run them, not reimplement them.
- **Existing content quality:** some entries look like template or sample data. The projects are `project-A` to
  `project-F` (for example "FinAI", and a `project-AeroDeliver` GitHub link), the work entries are
  `BigBossCorp` and similar, and the BYO lessons use generic placeholder text. Ask the owner which content is
  real before using it as style examples.
- **Delivery path:** feature branch → PR into `preview`, squash-merged → the Promote workflow keeps a
  `chore: promote preview to main` release PR open → merging it deploys to production. PR titles must be
  Conventional Commits; for content, `content(blog): add post on X`. Every PR gets a Vercel preview URL
  ("View deployment") and an automatic Claude review. Content and docs-only PRs skip that review.
- **Existing AI in the repo:** `.github/workflows/claude.yml` (`@claude` on issues and PRs, owner and
  collaborators only) and `claude-code-review.yml`, using the `CLAUDE_CODE_OAUTH_TOKEN` secret (a Claude Pro
  subscription). An issue-driven flow such as "open an issue, `@claude` drafts a PR" is possible with what's
  already set up. Evaluate it.

## Research checklist

- **Prior art:** AI features in Git-based CMSs (Decap/Netlify CMS, TinaCMS, Keystatic, Pages CMS, CloudCannon),
  Astro-specific tools and integrations, MDX-aware writing assistants, and open-source "blog post from outline"
  or translation pipelines. Note licensing, maintenance status, and whether each works with a static Astro site
  and MDX content collections.
- **Translation:** LLM translation with a glossary and style guide versus DeepL-style APIs. How to keep code
  blocks, frontmatter keys and MDX components intact. How to keep translations in sync when the English post
  changes, for example by storing a hash of the source or bumping `updatedAt`.
- **Quality gates:** schema validation, link checking (CI will have a link checker), Vale-style prose linting,
  fact-checking for technical claims, plagiarism checks, and human review on the Vercel preview.
- **Voice:** how to capture the owner's writing style (a style guide, examples, a prompt library) and measure
  whether drafts match it.
- **Cost and ops:** subscription token versus API key, per-post cost, where it runs (local CLI, Claude Code, or
  GitHub Actions), and secret handling. The repo is public: never let untrusted issue or PR authors trigger paid
  generation.
- **Images:** cover and gallery images. OG images are already automatic. Decide whether generated images are in
  scope at all.

## What to produce

1. **Landscape:** existing tools and approaches, each with fit, cost, maintenance and a verdict.
2. **Options:** 2–4 concrete architectures for this repo, with pros, cons and effort.
3. **Recommendation:** one option, the human-in-the-loop position it takes (see above), and what it would change
   in the repo: new files, schema fields, workflows and docs.
4. **Open questions for the owner:** decisions only they can make.
5. **Phased plan:** the smallest useful first version, then later additions.

Don't modify the repo during research. If a prototype would settle a question, describe it instead of building it.
