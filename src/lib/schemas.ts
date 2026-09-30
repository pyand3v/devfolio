// The content model: frontmatter schemas and the fields each entry takes from its file path. This is the
// single source of truth for `src/content.config.mjs`, `scripts/content-check.mjs` and
// `scripts/content.mjs`. The scripts run it with Node's built-in TypeScript support, so it may only use
// erasable syntax and relative imports (no `@/` alias).
import { z } from "zod"
import { parseFlexibleDate } from "./dates.ts"
import { defaultLocale, locales } from "./i18n.ts"

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const LocaleSchema = z.enum(locales)
const SlugSchema = z.string().regex(slugPattern, "Must be lowercase kebab-case")
// YAML parsers may read an unquoted timestamp as a Date, so both forms normalize to an ISO string
const DateTimeSchema = z
  .union([z.iso.datetime({ offset: true }), z.date()])
  .transform(value => (typeof value === "string" ? value : value.toISOString()))

/**
 * Checks a start/end pair the pages format with `formatDateRange`: both must be dates like "Jan 2024",
 * "2024-01" or "Present", and the start can't be after the end.
 */
function checkDateRange(startKey: string, endKey: string) {
  return (entry: Record<string, unknown>, context: z.RefinementCtx) => {
    const [start, end] = [String(entry[startKey]), String(entry[endKey])]
    const [from, to] = [parseFlexibleDate(start), parseFlexibleDate(end)]
    for (const [key, value, date] of [
      [startKey, start, from],
      [endKey, end, to],
    ] as const) {
      if (Number.isNaN(date.getTime())) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `"${value}" isn't a date: use "Jan 2024", "2024-01" or "Present"`,
        })
      }
    }
    if (start !== end && from.getTime() > to.getTime()) {
      context.addIssue({
        code: "custom",
        path: [endKey],
        message: `${endKey} "${end}" is before ${startKey} "${start}"`,
      })
    }
  }
}

/** Blog fields every translation shares. They're written only in the default-locale file. */
export const sharedBlogFields = ["featured", "publishedAt", "updatedAt"] as const

export const BlogPostSchema = z
  .object({
    locale: LocaleSchema,
    slug: SlugSchema,
    title: z.string().min(1),
    summary: z.string().min(1),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    publishedAt: DateTimeSchema.optional(),
    updatedAt: DateTimeSchema.optional(),
  })
  .superRefine((post, context) => {
    if (post.locale === defaultLocale) {
      if (!post.publishedAt) {
        context.addIssue({
          code: "custom",
          path: ["publishedAt"],
          message: `publishedAt is required in the ${defaultLocale} version`,
        })
      }
      return
    }
    for (const field of sharedBlogFields) {
      if (post[field] !== undefined) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: `${field} belongs only in the ${defaultLocale} version, which every translation shares`,
        })
      }
    }
  })

export const WorkItemSchema = z
  .object({
    slug: SlugSchema,
    company: z.string().min(1),
    title: z.string().min(1),
    start: z.string(),
    end: z.string(),
    description: z.string(),
    locations: z.array(z.string()),
    logoUrl: z.string().optional(),
    companyUrl: z.string().optional(),
    techStack: z.array(z.string()).optional(),
  })
  .superRefine(checkDateRange("start", "end"))

export const ProjectSchema = z
  .object({
    slug: SlugSchema,
    title: z.string().min(1),
    image: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    techStack: z.array(z.string()),
    teamSize: z.number().optional(),
    role: z.string().optional(),
    githubUrl: z.string().optional(),
    paperUrl: z.string().optional(),
    gallery: z.array(z.object({ src: z.string(), alt: z.string() })).optional(),
  })
  .superRefine(checkDateRange("startDate", "endDate"))

const byoEntryFields = {
  locale: LocaleSchema,
  slug: SlugSchema,
  title: z.string().min(1),
  description: z.string(),
}
const byoChildFields = {
  ...byoEntryFields,
  project: SlugSchema,
  order: z.number().int().positive(),
}

export const ByoEntrySchema = z.discriminatedUnion("type", [
  z.object({
    ...byoEntryFields,
    type: z.literal("project"),
    estimatedMinutes: z.number().int().positive(),
    chapters: z
      .array(
        z.object({
          order: z.number().int().positive(),
          title: z.string(),
          description: z.string(),
        })
      )
      .min(1),
  }),
  z.object({ ...byoChildFields, type: z.literal("lesson"), chapter: z.number().int().positive() }),
  z.object({ ...byoChildFields, type: z.literal("guide") }),
  z.object({
    ...byoChildFields,
    type: z.literal("exercise"),
    difficulty: z.enum(["easy", "medium", "hard"]),
  }),
])

export type BlogPostFrontmatter = z.infer<typeof BlogPostSchema>
export type WorkItemFrontmatter = z.infer<typeof WorkItemSchema>
export type ProjectFrontmatter = z.infer<typeof ProjectSchema>
export type ByoEntryFrontmatter = z.infer<typeof ByoEntrySchema>

export type Collection = "blog" | "work" | "projects" | "byo"

/** Where each collection lives, relative to the repository root. */
export const contentDirectories: Record<Collection, string> = {
  blog: "src/data/blog",
  work: "src/data/work",
  projects: "src/data/projects",
  byo: "src/data/byo",
}

/** File name, without the extension, of a BYO course's own entry inside its folder. */
export const byoCourseFile = "project"

const localePattern = locales.join("|")
const pathPatterns: Record<Collection, RegExp> = {
  blog: new RegExp(`^(${localePattern})/([^/]+)$`),
  work: /^([^/]+)$/,
  projects: /^([^/]+)$/,
  byo: new RegExp(`^(${localePattern})/([^/]+)/([^/]+)$`),
}
const expectedPaths: Record<Collection, string> = {
  blog: "<locale>/<slug>.mdx",
  work: "<slug>.mdx",
  projects: "<slug>.mdx",
  byo: `<locale>/<course>/<slug or ${byoCourseFile}>.mdx`,
}

/**
 * Reads the fields an entry takes from its path, e.g. `es/my-post` in the blog gives
 * `{ locale: "es", slug: "my-post" }`. `entryPath` is relative to the collection directory, uses forward
 * slashes and has no extension.
 */
export function fieldsFromPath(
  collection: Collection,
  entryPath: string
): Record<string, string> | undefined {
  const match = entryPath.match(pathPatterns[collection])
  if (!match) return undefined
  switch (collection) {
    case "blog":
      return { locale: match[1], slug: match[2] }
    case "byo":
      return {
        locale: match[1],
        project: match[2],
        slug: match[3] === byoCourseFile ? match[2] : match[3],
      }
    default:
      return { slug: match[1] }
  }
}

/**
 * Combines an entry's frontmatter with the fields its path defines. The path wins: frontmatter may
 * repeat a path field (the CMS writes `project` into BYO entries) but not contradict it.
 */
export function resolveEntryData(
  collection: Collection,
  entryPath: string,
  frontmatter: Record<string, unknown>
): { data: Record<string, unknown>; errors: string[] } {
  const fields = fieldsFromPath(collection, entryPath)
  if (!fields) {
    return {
      data: frontmatter,
      errors: [`must be at ${contentDirectories[collection]}/${expectedPaths[collection]}`],
    }
  }
  const errors = Object.entries(fields)
    .filter(([key, value]) => key in frontmatter && frontmatter[key] !== value)
    .map(([key, value]) => `${key} is "${frontmatter[key]}", but the file path says "${value}"`)
  return { data: { ...frontmatter, ...fields }, errors }
}

/** The schema each collection's frontmatter is validated with, after `resolveEntryData`. */
export const collectionSchemas = {
  blog: BlogPostSchema,
  work: WorkItemSchema,
  projects: ProjectSchema,
  byo: ByoEntrySchema,
} satisfies Record<Collection, z.ZodType>
