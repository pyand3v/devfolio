import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const metadataDirectory = path.join(root, "src", "data", "blog", "metadata")
const blogDirectory = path.join(root, "src", "data", "blog")
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const supportedLanguages = new Set(["en", "es", "pt-br"])

async function mdxFiles(directory) {
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

async function frontmatter(file) {
  const source = await readFile(file, "utf8")
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) throw new Error(`${path.relative(root, file)} has no frontmatter.`)

  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => {
        const separator = line.indexOf(":")
        const key = line.slice(0, separator).trim()
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^['"]|['"]$/g, "")
        return [key, value]
      })
  )
}

const errors = []
const metadata = await Promise.all(
  (await mdxFiles(metadataDirectory)).map(async file => ({
    key: path.basename(file, ".mdx"),
    data: await frontmatter(file),
  }))
)
const seenSlugs = new Set()
const metadataByKey = new Map()

for (const record of metadata) {
  const { key, data } = record
  metadataByKey.set(key, record)
  const languages = (data.availableLanguages ?? "")
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)

  if (data.type !== "article") errors.push(`${key}: type must be "article".`)
  if (!validSlug.test(data.slug ?? "")) errors.push(`${key}: slug must be lowercase kebab-case.`)
  if (seenSlugs.has(data.slug)) errors.push(`${key}: slug "${data.slug}" is duplicated.`)
  seenSlugs.add(data.slug)
  if (!languages.length || languages.some(language => !supportedLanguages.has(language))) {
    errors.push(`${key}: availableLanguages must contain only supported language codes.`)
  }
  if (!languages.includes(data.fallbackLanguage)) {
    errors.push(`${key}: fallbackLanguage must be listed in availableLanguages.`)
  }
}

const contentFiles = (await mdxFiles(blogDirectory)).filter(
  file => !file.startsWith(metadataDirectory)
)
const contentByKeyAndLocale = new Map()
for (const file of contentFiles) {
  const data = await frontmatter(file)
  const reference = data.translationKey
  const locale = data.locale
  const relative = path.relative(root, file)
  if (!metadataByKey.has(reference))
    errors.push(`${relative}: translationKey "${reference}" has no metadata file.`)
  if (!supportedLanguages.has(locale))
    errors.push(`${relative}: locale "${locale}" is unsupported.`)
  contentByKeyAndLocale.set(`${reference}:${locale}`, relative)
}

for (const record of metadata) {
  const languages = (record.data.availableLanguages ?? "")
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean)
  for (const language of languages) {
    if (!contentByKeyAndLocale.has(`${record.key}:${language}`)) {
      errors.push(`${record.key}: declares ${language}, but no matching localized MDX file exists.`)
    }
  }
}

async function validateEntryMetadata({
  type,
  contentDirectory,
  metadataDirectory,
  requiresAssetKey = false,
}) {
  const [contentFiles, metadataFiles] = await Promise.all([
    mdxFiles(contentDirectory),
    mdxFiles(metadataDirectory),
  ])
  const metadataKeys = new Set()

  for (const file of metadataFiles) {
    const key = path.basename(file, ".mdx").toLowerCase()
    const data = await frontmatter(file)
    metadataKeys.add(key)
    if (data.type !== type) errors.push(`${key}: type must be "${type}".`)
    if (!validSlug.test(data.slug ?? "")) errors.push(`${key}: slug must be lowercase kebab-case.`)
    if (seenSlugs.has(data.slug)) errors.push(`${key}: slug "${data.slug}" is duplicated.`)
    seenSlugs.add(data.slug)
    if (requiresAssetKey && !data.assetKey) errors.push(`${key}: assetKey is required.`)
  }

  for (const file of contentFiles) {
    const key = path.basename(file, ".mdx").toLowerCase()
    if (!metadataKeys.has(key)) {
      errors.push(`${path.relative(root, file)}: missing ${type} metadata file.`)
    }
  }

  for (const key of metadataKeys) {
    if (!contentFiles.some(file => path.basename(file, ".mdx").toLowerCase() === key)) {
      errors.push(`${key}: ${type} metadata has no matching content MDX file.`)
    }
  }
}

await validateEntryMetadata({
  type: "project",
  contentDirectory: path.join(root, "src", "data", "projects"),
  metadataDirectory: path.join(root, "src", "data", "metadata", "projects"),
  requiresAssetKey: true,
})
await validateEntryMetadata({
  type: "work",
  contentDirectory: path.join(root, "src", "data", "work"),
  metadataDirectory: path.join(root, "src", "data", "metadata", "work"),
})

if (errors.length) {
  console.error(`Content validation failed:\n- ${errors.join("\n- ")}`)
  process.exit(1)
}

console.log(
  `Content validation passed for ${metadata.length} article metadata records and all project/work metadata.`
)
