# Writing content

All content is MDX in `src/data/`, one file per entry and language. There are three ways to add or change it,
and they all produce the same files: the CMS at `/admin`, the `pnpm content` CLI, or editing files by hand.
Every change reaches the site through a pull request into `preview`, like any other change.

The tools only create files and check them. They never write text for you.

## Where content lives

| Type        | File                                                  | Taken from the path        |
| ----------- | ----------------------------------------------------- | -------------------------- |
| Blog post   | `src/data/blog/<locale>/<slug>.mdx`                   | `locale`, `slug`           |
| Work entry  | `src/data/work/<slug>.mdx`                            | `slug`                     |
| Project     | `src/data/projects/<slug>.mdx`                        | `slug`                     |
| BYO course  | `src/data/byo/<locale>/<course>/project.mdx`          | `locale`, `slug` (course)  |
| BYO lesson, guide or exercise | `src/data/byo/<locale>/<course>/<slug>.mdx` | `locale`, `project`, `slug` |

The file path decides the URL, so never repeat those fields in the frontmatter. `/blog/<slug>`, `/es/blog/<slug>`
and `/byo/<course>/lessons/<slug>` all come from file names.

- **Blog posts** need an `en` version. It holds the fields every translation shares: `publishedAt`, `updatedAt`
  (optional, defaults to `publishedAt`) and `featured` (only featured posts are listed). A translation is the same
  file name under `es/` or `pt-br/` with its own `title`, `summary`, `tags` and body. A post without a translation
  shows the English version on the Spanish and Portuguese sites.
- **BYO entries** must exist in all three languages. Lessons are numbered 1, 2, 3... without gaps, and each lesson's
  `chapter` must be one of its course's `chapters`.
- **Images** live in `public/`, next to the entry they belong to: `public/blog/<slug>/`,
  `public/projects/<slug>/` (the cover and the `gallery`), `public/byo/<course>/` and `public/work/` (logos).
- **Dates**: work entries use `Jan 2024` or `Present`, projects use `2024-01`, and a range can't end before it
  starts.

The schemas are in `src/lib/schemas.ts`. `pnpm content:check`, which runs before every build, checks every file
against them. It also checks translations, lesson order and that every referenced image exists.

## Option 1: the CMS

Sveltia CMS runs at [pyan.dev/admin](https://www.pyan.dev/admin/). Each save commits to a `cms/...` branch and opens
a PR into `preview`, titled like `content: add my-post`. The PR gets the usual checks and a Vercel preview. Publishing
in the CMS (or merging on GitHub) squash-merges it.

**Signing in**: choose **Sign In Using Access Token** and paste a
[fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) for `pyand3v/devfolio`
with read and write access to **Contents**, **Pull requests** and **Issues** (the CMS tracks review status with
labels). The token stays in that browser. "Sign in with GitHub" needs an OAuth app and an auth proxy such as
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth), which isn't set up.

**Working locally**: run `pnpm dev`, open `http://localhost:4321/admin/index.html` in Chrome or Edge, choose
**Work with Local Repository** and select the repository folder. Changes are written straight to your working
copy; commit them yourself or with `pnpm content pr`. Nothing touches GitHub, so use this for drafting and
experiments: signed-in saves on `/admin` always create a `cms/...` branch and PR.

**Cleaning up `cms/...` branches**: they live until their PR is merged or closed. Deleting a draft from the CMS
**Workflow** tab closes its PR and removes the branch. The repository's **Automatically delete head branches**
setting removes the branch when a PR is merged.

Things to know:

- **Blog translations**: new posts start in English only. Enable Spanish or Portuguese in the editor's locale
  switcher when you translate.
- **BYO lessons, guides and exercises** are listed per course. When you create one, pick the course folder as its
  location.
- **The body editor opens in raw Markdown**, because entries can contain MDX (imports, `<Timeline>`, HTML) that the
  rich text editor may not preserve. Switch to rich text only for plain Markdown.
- **Add images from inside an entry**, so they're committed with it in its PR. Uploading from the Assets page can
  commit straight to `preview`.
- **The file list is cached in the browser.** If it looks out of date after a merge, reload the page.

## Option 2: the CLI

```bash
pnpm content help
```

| Command                                             | What it does                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `pnpm content new blog`                             | Create a post in `en`, dated now and not featured                   |
| `pnpm content new work`                             | Create a work entry                                                 |
| `pnpm content new project --cover <file>`           | Create a project and copy its cover image                           |
| `pnpm content new course`                           | Create a BYO course in every language                               |
| `pnpm content new lesson\|guide\|exercise --course <slug>` | Add the next lesson, guide or exercise to a course in every language |
| `pnpm content translate <slug> <locale>`            | Start a translation from the English post (you translate over it)   |
| `pnpm content image <target> <files...>`            | Copy images into place; for projects, add them to the gallery       |
| `pnpm content check`                                | Same as `pnpm content:check`                                        |
| `pnpm content pr --title "content(blog): add post on caching"` | Validate, build, commit `src/data` and `public/`, push and open a PR into `preview` |

Anything you don't pass as an option is asked for. `<target>` is `blog/<slug>`, `projects/<slug>`, `byo/<course>` or
`work`. Every entry is checked against its schema before it's written. BYO entries in other languages start as copies
of the English one, for you to translate.

`pnpm content pr` creates a `content/...` branch when you're on `preview` or `main`, and only commits content: other
changes are listed and left alone. Pass `--no-build` to skip the production build.

## Option 3: by hand

Create or edit the files described above, then run `pnpm content:check`. Open the PR as described in
[CONTRIBUTING.md](../CONTRIBUTING.md), with a title like `content(blog): add post on caching`.
