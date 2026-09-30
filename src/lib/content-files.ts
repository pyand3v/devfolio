// Pure helpers behind the `pnpm content` CLI (scripts/content.mjs): naming, file paths and MDX
// (de)serialization. Like schemas.ts, this runs under Node's built-in TypeScript support, so it may only
// use erasable syntax and relative imports.
import { Document, isScalar, parse, Scalar, visit } from "yaml"
import { defaultLocale, type Locale } from "./i18n.ts"
import { byoCourseFile, contentDirectories, sharedBlogFields } from "./schemas.ts"

/** Turns any text into a lowercase kebab-case slug, e.g. "Hola, Señor!" becomes "hola-senor". */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** A timestamp in local time with its UTC offset, e.g. `2026-09-30T10:15:00-03:00`. */
export function isoWithOffset(date: Date): string {
  const pad = (value: number) => String(Math.abs(value)).padStart(2, "0")
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? "+" : "-"
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`
  )
}

/** The next position after the given ones, e.g. the order of a new lesson. */
export const nextOrder = (orders: number[]) => Math.max(0, ...orders) + 1

export type Frontmatter = Record<string, unknown>

export function parseMdx(source: string): { data: Frontmatter; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/)
  if (!match) throw new Error("The file has no frontmatter.")
  return { data: (parse(match[1]) as Frontmatter | null) ?? {}, body: match[2].replace(/^\n+/, "") }
}

const isoDateTime = /^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/

/** Writes frontmatter and body back as MDX. Timestamps are quoted so no parser turns them into dates. */
export function stringifyMdx(data: Frontmatter, body = ""): string {
  const document = new Document(data)
  visit(document, {
    Scalar(_key, node) {
      if (isScalar(node) && typeof node.value === "string" && isoDateTime.test(node.value)) {
        node.type = Scalar.QUOTE_DOUBLE
      }
    },
  })
  const text = body.trim()
  return `---\n${document.toString({ lineWidth: 0 }).trimEnd()}\n---\n${text ? `\n${text}\n` : ""}`
}

/** Repository path of a blog post's file in the given locale. */
export const blogPostPath = (slug: string, locale: Locale = defaultLocale) =>
  `${contentDirectories.blog}/${locale}/${slug}.mdx`

/** Repository path of a BYO entry. The course's own entry is `project.mdx` in its folder. */
export const byoEntryPath = (locale: Locale, course: string, slug = byoCourseFile) =>
  `${contentDirectories.byo}/${locale}/${course}/${slug}.mdx`

/**
 * The frontmatter of a new translation: the default-locale post without the fields every translation
 * shares, which stay in the default-locale file.
 */
export function translationFrontmatter(source: Frontmatter): Frontmatter {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !(sharedBlogFields as readonly string[]).includes(key))
  )
}

export type MediaTarget = { collection: "blog" | "projects" | "work" | "byo"; slug?: string }

/**
 * Reads an `image` command target: `blog/<slug>`, `projects/<slug>`, `byo/<course>` or `work`.
 * Returns undefined when it isn't one of those.
 */
export function parseMediaTarget(target: string): MediaTarget | undefined {
  const [collection, slug, ...rest] = target.split("/")
  if (rest.length) return undefined
  if (collection === "work") return slug ? undefined : { collection }
  if (collection === "blog" || collection === "projects" || collection === "byo") {
    return slug ? { collection, slug } : undefined
  }
  return undefined
}

/** Public URL of the folder an entry's images go in; the file lives under `public/` at the same path. */
export const mediaFolder = ({ collection, slug }: MediaTarget) =>
  slug ? `/${collection}/${slug}` : `/${collection}`

/** A clean file name for an uploaded image, e.g. `Screen Shot 1.PNG` becomes `screen-shot-1.png`. */
export function mediaFileName(original: string): string {
  const name = original.split(/[\\/]/).pop() ?? original
  const dot = name.lastIndexOf(".")
  const base = dot > 0 ? name.slice(0, dot) : name
  const extension = dot > 0 ? name.slice(dot).toLowerCase() : ""
  return `${slugify(base) || "image"}${extension}`
}

/** Default alt text from a file name, e.g. `home-screen.png` becomes "Home screen". */
export function altFromFileName(fileName: string): string {
  const words = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// Mirrors .github/scripts/check-pr-title.sh, which the PR Title check runs
const titleTypes = "feat|fix|content|docs|style|refactor|perf|test|build|ci|chore|revert"
const conventionalTitle = new RegExp(`^(${titleTypes})(\\([a-z0-9./-]+\\))?!?: [^ ].*[^.]$`)

/** Whether a PR title passes the repository's Conventional Commits check. */
export const isConventionalTitle = (title: string) => conventionalTitle.test(title)

/** A branch name for a PR title, e.g. `content(blog): add post on X` becomes `content/add-post-on-x`. */
export function branchForTitle(title: string): string {
  const slug = slugify(title.slice(title.indexOf(":") + 1))
  // At most 50 characters, cut between words
  const short = slug.length > 50 ? slug.slice(0, 51).replace(/-[^-]*$/, "") : slug
  return `content/${short || "update"}`
}
