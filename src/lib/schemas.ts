import { z } from "zod"

export const BlogFrontmatterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  tags: z.array(z.string()).optional(),
})

export const WorkItemFrontmatterSchema = z.object({
  company: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  description: z.string(),
  locations: z.array(z.string()),
  logoUrl: z.string().optional(),
  companyUrl: z.string().optional(),
  techStack: z.array(z.string()).optional(),
})

export const ProjectFrontmatterSchema = z.object({
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
})

export const ByoEntryFrontmatterSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("project"), title: z.string(), description: z.string() }),
  z.object({
    type: z.literal("lesson"),
    title: z.string(),
    description: z.string(),
    project: z.string(),
    chapter: z.number().int().positive(),
    order: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("guide"),
    title: z.string(),
    description: z.string(),
    project: z.string(),
    order: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("exercise"),
    title: z.string(),
    description: z.string(),
    project: z.string(),
    order: z.number().int().positive(),
    difficulty: z.enum(["easy", "medium", "hard"]),
  }),
])

export type BlogPostFrontmatter = z.infer<typeof BlogFrontmatterSchema>
export type WorkItemFrontmatter = z.infer<typeof WorkItemFrontmatterSchema>
export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatterSchema>
export type ByoEntryFrontmatter = z.infer<typeof ByoEntryFrontmatterSchema>
