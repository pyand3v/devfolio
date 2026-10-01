/**
 * @description This interface defines the structure (i.e., contents) of a blog post card.
 */
export interface BlogPostProps {
  slug: string
  title: string
  summary: string
  date: string
  tags?: string[]
  readingTime?: number
}

export type { BlogPostFrontmatter } from "@/lib/schemas"

/**
 * @description This interface defines the structure (i.e., contents) of a project card.
 */
export interface ProjectProps {
  slug: string
  title: string
  image: string
  description: string
  startDate: string
  endDate: string
  techStack: string[]
  teamSize?: number
  role?: string
  githubUrl?: string
  paperUrl?: string
}

export type { ProjectFrontmatter } from "@/lib/schemas"

/**
 * @description This interface defines the structure (i.e., contents) of a work experience item.
 */
export interface WorkItemProps {
  slug: string
  company: string
  title: string
  start: string
  end: string
  description: string
  locations: string[]
  logoUrl?: string
  companyUrl?: string
  techStack?: string[]
}

export type { WorkItemFrontmatter } from "@/lib/schemas"

/**
 * @description Shape of the site-wide metadata configuration object in src/data/metadata.ts.
 */
export interface SiteMetadata {
  title: string
  description: string
  keywords: string[]
  author: {
    name: string
    url: string
  }
  siteUrl: string
  social: {
    twitter: string
  }
  /** Set to null to use the auto-generated dynamic OG image for the home page. */
  ogImage: string | null
}
