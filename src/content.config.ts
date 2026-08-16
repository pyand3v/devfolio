import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "./src/data/blog",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z.object({
    locale: z.enum(["en", "es", "pt-br"]),
    translationKey: z.string(),
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    publishedAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    tags: z.array(z.string()).optional(),
  }),
})

const work = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/data/work" }),
  schema: z.object({
    company: z.string(),
    title: z.string(),
    start: z.string(),
    end: z.string(),
    description: z.string(),
    locations: z.array(z.string()),
    logoUrl: z.string().optional(),
    companyUrl: z.string().optional(),
    techStack: z.array(z.string()).optional(),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/data/projects" }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    techStack: z.array(z.string()),
    teamSize: z.number().optional(),
    role: z.string().optional(),
    githubUrl: z.string().optional(),
    paperUrl: z.string().optional(),
  }),
})

export const collections = { blog, work, projects }
