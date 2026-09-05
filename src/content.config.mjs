import { defineCollection } from "astro:content"
import { z } from "astro/zod"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

async function findMdxFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(entry => {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) return findMdxFiles(file)
      return entry.isFile() && entry.name.endsWith(".mdx") ? [file] : []
    })
  )
  return files.flat()
}

function mdxLoader(base, include = () => true) {
  return {
    name: "native-mdx-loader",
    async load({ config, entryTypes, parseData, store, generateDigest }) {
      const baseDirectory = path.resolve(fileURLToPath(config.root), base)
      const entryType = entryTypes.get(".mdx")
      if (!entryType) throw new Error(`No MDX entry type is registered for ${base}.`)

      const untouchedEntries = new Set(store.keys())
      const files = (await findMdxFiles(baseDirectory)).filter(file =>
        include(path.relative(baseDirectory, file).replaceAll("\\", "/"))
      )
      for (const file of files) {
        const contents = await fs.readFile(file, "utf8")
        const { body, data } = await entryType.getEntryInfo({
          contents,
          fileUrl: pathToFileURL(file),
        })
        const relativeEntry = path.relative(baseDirectory, file).replaceAll("\\", "/")
        const id = relativeEntry.replace(/\.mdx$/, "").toLowerCase()
        const relativePath = path.relative(fileURLToPath(config.root), file).replaceAll("\\", "/")
        const digest = generateDigest(contents)
        const parsedData = await parseData({ id, data, filePath: file })
        untouchedEntries.delete(id)
        store.set({
          id,
          data: parsedData,
          body,
          filePath: relativePath,
          digest,
          deferredRender: true,
        })
        store.addModuleImport(relativePath)
      }

      untouchedEntries.forEach(id => store.delete(id))
    },
  }
}

const blog = defineCollection({
  loader: mdxLoader("./src/data/blog", entry => !entry.startsWith("metadata/")),
  schema: z.object({
    locale: z.enum(["en", "es", "pt-br"]),
    translationKey: z.string(),
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).optional(),
  }),
})

const blogMetadata = defineCollection({
  loader: mdxLoader("./src/data/blog/metadata"),
  schema: z
    .object({
      type: z.literal("article"),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      availableLanguages: z.array(z.enum(["en", "es", "pt-br"])).min(1),
      fallbackLanguage: z.enum(["en", "es", "pt-br"]),
      featured: z.boolean(),
      publishedAt: z.iso.datetime({ offset: true }),
      updatedAt: z.iso.datetime({ offset: true }),
    })
    .refine(data => data.availableLanguages.includes(data.fallbackLanguage), {
      message: "fallbackLanguage must be included in availableLanguages",
      path: ["fallbackLanguage"],
    }),
})

const work = defineCollection({
  loader: mdxLoader("./src/data/work"),
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

const workMetadata = defineCollection({
  loader: mdxLoader("./src/data/metadata/work"),
  schema: z.object({
    type: z.literal("work"),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
})

const projects = defineCollection({
  loader: mdxLoader("./src/data/projects"),
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

const projectMetadata = defineCollection({
  loader: mdxLoader("./src/data/metadata/projects"),
  schema: z.object({
    type: z.literal("project"),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    assetKey: z.string(),
  }),
})

const byo = defineCollection({
  loader: mdxLoader("./src/data/byo"),
  schema: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("project"),
      locale: z.enum(["en", "es", "pt-br"]),
      translationKey: z.string(),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      title: z.string(),
      description: z.string(),
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
    z.object({
      type: z.literal("lesson"),
      locale: z.enum(["en", "es", "pt-br"]),
      translationKey: z.string(),
      project: z.string(),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      chapter: z.number().int().positive(),
      order: z.number().int().positive(),
      title: z.string(),
      description: z.string(),
    }),
    z.object({
      type: z.literal("guide"),
      locale: z.enum(["en", "es", "pt-br"]),
      translationKey: z.string(),
      project: z.string(),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      order: z.number().int().positive(),
      title: z.string(),
      description: z.string(),
    }),
    z.object({
      type: z.literal("exercise"),
      locale: z.enum(["en", "es", "pt-br"]),
      translationKey: z.string(),
      project: z.string(),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      order: z.number().int().positive(),
      title: z.string(),
      description: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    }),
  ]),
})

export const collections = {
  blog,
  blogMetadata,
  work,
  workMetadata,
  projects,
  projectMetadata,
  byo,
}
