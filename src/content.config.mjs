import { defineCollection } from "astro:content"
import { promises as fs } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  BlogPostSchema,
  ByoEntrySchema,
  contentDirectories,
  ProjectSchema,
  resolveEntryData,
  WorkItemSchema,
} from "./lib/schemas.ts"

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

// Loads every MDX file under a collection's directory. Fields that come from the file path (locale, slug,
// BYO course) are added to the frontmatter before it's validated, so files never have to repeat them.
function mdxLoader(collection) {
  return {
    name: "native-mdx-loader",
    async load({ config, entryTypes, parseData, store, generateDigest }) {
      const baseDirectory = path.resolve(fileURLToPath(config.root), contentDirectories[collection])
      const entryType = entryTypes.get(".mdx")
      if (!entryType) throw new Error(`No MDX entry type is registered for ${collection}.`)

      const untouchedEntries = new Set(store.keys())
      for (const file of await findMdxFiles(baseDirectory)) {
        const contents = await fs.readFile(file, "utf8")
        const { body, data: frontmatter } = await entryType.getEntryInfo({
          contents,
          fileUrl: pathToFileURL(file),
        })
        const id = path
          .relative(baseDirectory, file)
          .replaceAll("\\", "/")
          .replace(/\.mdx$/, "")
        const relativePath = path.relative(fileURLToPath(config.root), file).replaceAll("\\", "/")
        const { data, errors } = resolveEntryData(collection, id, frontmatter)
        if (errors.length) throw new Error(`${relativePath}: ${errors.join("; ")}`)

        const parsedData = await parseData({ id, data, filePath: file })
        untouchedEntries.delete(id)
        store.set({
          id,
          data: parsedData,
          body,
          filePath: relativePath,
          digest: generateDigest(contents),
          deferredRender: true,
        })
        store.addModuleImport(relativePath)
      }

      untouchedEntries.forEach(id => store.delete(id))
    },
  }
}

export const collections = {
  blog: defineCollection({ loader: mdxLoader("blog"), schema: BlogPostSchema }),
  work: defineCollection({ loader: mdxLoader("work"), schema: WorkItemSchema }),
  projects: defineCollection({ loader: mdxLoader("projects"), schema: ProjectSchema }),
  byo: defineCollection({ loader: mdxLoader("byo"), schema: ByoEntrySchema }),
}
