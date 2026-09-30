// Validates all content before a build: each file against the same Zod schemas the Astro build uses,
// plus the rules that span several files (translations, BYO lesson order, images in public/).
import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { parse } from "yaml"
import { defaultLocale, locales } from "../src/lib/i18n.ts"
import {
  BlogPostSchema,
  ByoEntrySchema,
  byoCourseFile,
  contentDirectories,
  ProjectSchema,
  resolveEntryData,
  WorkItemSchema,
} from "../src/lib/schemas.ts"

const root = path.resolve(import.meta.dirname, "..")
const schemas = {
  blog: BlogPostSchema,
  work: WorkItemSchema,
  projects: ProjectSchema,
  byo: ByoEntrySchema,
}
const errors = []

async function mdxFiles(directory) {
  if (!existsSync(directory)) return []
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async entry => {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) return mdxFiles(file)
      return entry.isFile() && entry.name.endsWith(".mdx") ? [file] : []
    })
  )
  return nested.flat()
}

function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/)
  return match ? { frontmatter: parse(match[1]) ?? {}, body: match[2] } : undefined
}

// Absolute paths to files in public/ that an entry points at, from its frontmatter and its body. Code
// blocks and inline code are skipped, since their paths are examples.
function publicReferences(data, body) {
  const fromFrontmatter = [data.image, data.logoUrl, ...(data.gallery ?? []).map(item => item.src)]
  const prose = body.replace(/^(```|~~~)[\s\S]*?^\1/gm, "").replace(/`[^`\n]*`/g, "")
  const fromBody = [
    ...prose.matchAll(/\bsrc=["'](\/[^"']+)["']/g),
    ...prose.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)/g),
  ].map(match => match[1])
  return [...fromFrontmatter, ...fromBody].filter(
    reference => typeof reference === "string" && reference.startsWith("/")
  )
}

async function loadCollection(collection) {
  const directory = path.join(root, contentDirectories[collection])
  const entries = []
  for (const file of await mdxFiles(directory)) {
    const relative = path.relative(root, file).replaceAll("\\", "/")
    const parsed = splitFrontmatter(await readFile(file, "utf8"))
    if (!parsed) {
      errors.push(`${relative}: has no frontmatter.`)
      continue
    }
    const entryPath = path
      .relative(directory, file)
      .replaceAll("\\", "/")
      .replace(/\.mdx$/, "")
    const resolved = resolveEntryData(collection, entryPath, parsed.frontmatter)
    errors.push(...resolved.errors.map(error => `${relative}: ${error}.`))
    if (resolved.errors.length) continue

    const result = schemas[collection].safeParse(resolved.data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${relative}: ${issue.path.join(".") || "frontmatter"}: ${issue.message}.`)
      }
      continue
    }
    for (const reference of publicReferences(result.data, parsed.body)) {
      if (!existsSync(path.join(root, "public", decodeURI(reference.split(/[?#]/)[0])))) {
        errors.push(`${relative}: ${reference} doesn't exist in public/.`)
      }
    }
    entries.push({ relative, data: result.data })
  }
  return entries
}

const blog = await loadCollection("blog")
const work = await loadCollection("work")
const projects = await loadCollection("projects")
const byo = await loadCollection("byo")

// Every blog post needs a default-locale version: it holds the fields its translations share
const blogLocales = Map.groupBy(blog, entry => entry.data.slug)
for (const [slug, translations] of blogLocales) {
  if (!translations.some(entry => entry.data.locale === defaultLocale)) {
    errors.push(
      `blog "${slug}": has no ${defaultLocale} version (src/data/blog/${defaultLocale}/${slug}.mdx).`
    )
  }
}

// Every BYO entry exists in every locale, and each course's lessons are numbered 1, 2, 3...
const byoTranslations = Map.groupBy(byo, ({ data }) => `${data.project}/${data.slug}`)
for (const [key, translations] of byoTranslations) {
  const missing = locales.filter(locale => !translations.some(({ data }) => data.locale === locale))
  if (missing.length) errors.push(`byo "${key}": missing ${missing.join(", ")} translation.`)
}
const courses = new Map(
  byo
    .filter(({ data }) => data.type === "project")
    .map(({ data }) => [`${data.locale}/${data.slug}`, data])
)
for (const { relative, data } of byo.filter(({ data }) => data.type !== "project")) {
  if (!courses.has(`${data.locale}/${data.project}`)) {
    errors.push(`${relative}: course folder has no ${byoCourseFile}.mdx.`)
  }
}
const lessons = Map.groupBy(
  byo.filter(({ data }) => data.type === "lesson"),
  ({ data }) => `${data.locale}/${data.project}`
)
for (const [key, courseLessons] of lessons) {
  const orders = courseLessons.map(({ data }) => data.order).sort((a, b) => a - b)
  if (orders.some((order, index) => order !== index + 1)) {
    errors.push(
      `byo "${key}": lesson order must run 1, 2, 3... without gaps (got ${orders.join(", ")}).`
    )
  }
  const chapters = new Set(courses.get(key)?.chapters.map(chapter => chapter.order))
  for (const { relative, data } of courseLessons) {
    if (!chapters.has(data.chapter)) {
      errors.push(`${relative}: chapter ${data.chapter} isn't in the course's chapters.`)
    }
  }
}

if (errors.length) {
  console.error(`Content validation failed:\n- ${errors.join("\n- ")}`)
  process.exit(1)
}

console.log(
  `Content validation passed: ${blogLocales.size} blog posts (${blog.length} files), ${work.length} work entries, ` +
    `${projects.length} projects, ${courses.size / locales.length} BYO courses (${byo.length} files).`
)
