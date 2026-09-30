// `pnpm content <command>`: scaffolds content, adds images and opens a content PR. It never writes prose;
// it only creates files with valid frontmatter for you to fill in. Run `pnpm content help` for usage.
import { execFileSync, spawnSync } from "node:child_process"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { createInterface } from "node:readline/promises"
import { text } from "node:stream/consumers"
import { parseArgs } from "node:util"
import {
  altFromFileName,
  blogPostPath,
  branchForTitle,
  byoEntryPath,
  isConventionalTitle,
  isoWithOffset,
  mediaFileName,
  mediaFolder,
  nextOrder,
  parseMdx,
  parseMediaTarget,
  slugify,
  stringifyMdx,
  translationFrontmatter,
} from "../src/lib/content-files.ts"
import { defaultLocale, locales } from "../src/lib/i18n.ts"
import {
  collectionSchemas,
  contentDirectories,
  resolveEntryData,
  slugPattern,
} from "../src/lib/schemas.ts"

const root = path.resolve(import.meta.dirname, "..")
process.chdir(root)

const usage = `Usage: pnpm content <command> [options]

  new blog                     Create a post in ${defaultLocale} (translate it later)
  new work                     Create a work entry
  new project --cover <file>   Create a project, copying its cover image into public/
  new course                   Create a BYO course in every locale
  new lesson|guide|exercise    Add an entry to a BYO course in every locale (--course <slug>)
  translate <slug> <locale>    Start a translation of a blog post from its ${defaultLocale} version
  image <target> <files...>    Copy images into public/ and print how to use them. <target> is
                               blog/<slug>, projects/<slug> (adds them to the gallery), byo/<course> or work
  check                        Validate all content (pnpm content:check)
  pr                           Validate, commit src/data and public/, push and open a PR into preview

Options: --title, --slug, --summary, --course, --cover, --alt, --no-build. Anything missing is asked for.`

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    title: { type: "string" },
    slug: { type: "string" },
    summary: { type: "string" },
    course: { type: "string" },
    cover: { type: "string" },
    alt: { type: "string" },
    "no-build": { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
})

class UserError extends Error {}
const fail = message => {
  throw new UserError(message)
}

let prompt
let pipedAnswers
// Reads one answer from the terminal, or, when answers are piped in, the next line of them
async function readAnswer(question) {
  if (process.stdin.isTTY) {
    prompt ??= createInterface({ input: process.stdin, output: process.stdout })
    return prompt.question(question)
  }
  pipedAnswers ??= (await text(process.stdin)).split(/\r?\n/)
  console.log(question)
  return pipedAnswers.shift()
}

async function ask(question, { fallback, optional = false } = {}) {
  const hint = fallback ? ` (${fallback})` : optional ? " (optional)" : ""
  const answer = (await readAnswer(`${question}${hint}: `))?.trim()
  if (answer) return answer
  if (fallback !== undefined || optional) return fallback ?? ""
  if (answer === undefined) fail(`No answer for "${question}". Pass it as an option or pipe it in.`)
  return ask(question, { fallback, optional })
}
const list = text =>
  text
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)

// Asks for a slug, suggesting one made from `from`, and checks the file it names doesn't exist yet
async function askSlug(from, fileFor) {
  const slug = options.slug ?? (await ask("Slug", { fallback: slugify(from) }))
  if (!slugPattern.test(slug)) fail(`"${slug}" isn't a valid slug: use lowercase-kebab-case.`)
  if (existsSync(fileFor(slug))) fail(`${fileFor(slug)} already exists.`)
  return slug
}

// Checks frontmatter against its collection's schema before anything is written
function validate(file, data) {
  const collection = Object.keys(contentDirectories).find(name =>
    file.startsWith(`${contentDirectories[name]}/`)
  )
  const entryPath = file.slice(contentDirectories[collection].length + 1).replace(/\.mdx$/, "")
  const resolved = resolveEntryData(collection, entryPath, data)
  const result = resolved.errors.length
    ? undefined
    : collectionSchemas[collection].safeParse(resolved.data)
  const problems = [
    ...resolved.errors,
    ...(result?.error?.issues ?? []).map(issue => `${issue.path.join(".")}: ${issue.message}`),
  ]
  if (problems.length) fail(`${file} wouldn't be valid:\n- ${problems.join("\n- ")}`)
}

function create(file, data, body) {
  if (existsSync(file)) fail(`${file} already exists.`)
  validate(file, data)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, stringifyMdx(data, body))
  console.log(`Created ${file}`)
}

function copyImage(source, folder, fileName = mediaFileName(source)) {
  if (!existsSync(source)) fail(`${source} doesn't exist.`)
  const target = path.join("public", folder, fileName)
  if (existsSync(target)) fail(`${target} already exists. Rename the file or delete the old one.`)
  mkdirSync(path.dirname(target), { recursive: true })
  copyFileSync(source, target)
  console.log(`Copied ${source} to ${target}`)
  return `${folder}/${fileName}`
}

const readEntry = file => parseMdx(readFileSync(file, "utf8"))
const courses = () =>
  existsSync(`${contentDirectories.byo}/${defaultLocale}`)
    ? readdirSync(`${contentDirectories.byo}/${defaultLocale}`)
    : []

async function newBlogPost() {
  const title = options.title ?? (await ask("Title"))
  const slug = await askSlug(title, blogPostPath)
  const summary = options.summary ?? (await ask("Summary"))
  const tags = list(await ask("Tags, comma-separated", { optional: true }))
  const now = isoWithOffset(new Date())
  create(blogPostPath(slug), {
    title,
    summary,
    ...(tags.length ? { tags } : {}),
    featured: false,
    publishedAt: now,
    updatedAt: now,
  })
  console.log(
    `Set featured: true to list it on the blog. Add images with: pnpm content image blog/${slug} <files>`
  )
}

async function newWorkEntry() {
  const title = options.title ?? (await ask("Role"))
  const company = await ask("Company")
  const slug = await askSlug(
    `${title} ${company}`,
    slug => `${contentDirectories.work}/${slug}.mdx`
  )
  create(`${contentDirectories.work}/${slug}.mdx`, {
    company,
    title,
    start: await ask("Start, e.g. Jan 2024"),
    end: await ask("End", { fallback: "Present" }),
    description: options.summary ?? (await ask("One-line description")),
    locations: list(await ask("Locations, comma-separated", { fallback: "Remote" })),
    techStack: list(await ask("Tech stack, comma-separated", { optional: true })),
  })
}

async function newProject() {
  const title = options.title ?? (await ask("Title"))
  const slug = await askSlug(title, slug => `${contentDirectories.projects}/${slug}.mdx`)
  const file = `${contentDirectories.projects}/${slug}.mdx`
  const cover = options.cover ?? (await ask("Cover image file"))
  if (!existsSync(cover)) fail(`${cover} doesn't exist.`)
  const month = isoWithOffset(new Date()).slice(0, 7)
  const folder = mediaFolder({ collection: "projects", slug })
  const coverName = `cover${path.extname(cover).toLowerCase()}`
  const data = {
    title,
    image: `${folder}/${coverName}`,
    description: options.summary ?? (await ask("One-line description")),
    startDate: await ask("Start month, YYYY-MM", { fallback: month }),
    endDate: await ask("End month, YYYY-MM", { fallback: month }),
    techStack: list(await ask("Tech stack, comma-separated")),
  }
  // Copy the cover only once the entry is known to be valid, so a mistake leaves nothing behind
  validate(file, data)
  copyImage(cover, folder, coverName)
  create(file, data)
  console.log(`Add screenshots with: pnpm content image projects/${slug} <files>`)
}

async function newCourse() {
  const title = options.title ?? (await ask("Course title"))
  const slug = await askSlug(title, slug => byoEntryPath(defaultLocale, slug))
  const data = {
    type: "project",
    title,
    description: options.summary ?? (await ask("One-line description")),
    estimatedMinutes: Number(await ask("Estimated minutes", { fallback: "60" })),
    chapters: [{ order: 1, title: await ask("First chapter title"), description: "" }],
  }
  if (!Number.isInteger(data.estimatedMinutes) || data.estimatedMinutes < 1) {
    fail("Estimated minutes must be a positive whole number.")
  }
  // Every locale starts as a copy of the default one, for you to translate
  for (const locale of locales) create(byoEntryPath(locale, slug), data)
  console.log(`Add lessons with: pnpm content new lesson --course ${slug}`)
}

async function newCourseEntry(type) {
  const known = courses()
  if (!known.length) fail("There are no BYO courses yet. Create one with: pnpm content new course")
  const course = options.course ?? (await ask(`Course (${known.join(", ")})`))
  if (!known.includes(course)) fail(`There's no course "${course}". Courses: ${known.join(", ")}.`)

  const siblings = readdirSync(`${contentDirectories.byo}/${defaultLocale}/${course}`).map(name =>
    readEntry(`${contentDirectories.byo}/${defaultLocale}/${course}/${name}`)
  )
  const title = options.title ?? (await ask("Title"))
  const slug = await askSlug(title, slug => byoEntryPath(defaultLocale, course, slug))
  const data = {
    type,
    project: course,
    order: nextOrder(
      siblings.filter(entry => entry.data.type === type).map(entry => entry.data.order)
    ),
    title,
    description: options.summary ?? (await ask("One-line description")),
  }
  if (type === "lesson") {
    const chapters = siblings.find(entry => entry.data.type === "project")?.data.chapters ?? []
    const orders = chapters.map(chapter => chapter.order)
    data.chapter = Number(
      await ask(`Chapter (${orders.join(", ")})`, { fallback: String(Math.max(1, ...orders)) })
    )
    if (!orders.includes(data.chapter))
      fail(`Chapter ${data.chapter} isn't in the course. Add it to the course's chapters first.`)
  }
  if (type === "exercise") {
    data.difficulty = await ask("Difficulty (easy, medium, hard)", { fallback: "medium" })
    if (!["easy", "medium", "hard"].includes(data.difficulty))
      fail("Difficulty must be easy, medium or hard.")
  }
  for (const locale of locales) create(byoEntryPath(locale, course, slug), data)
}

function translate([slug, locale]) {
  if (!slug || !locale) fail("Usage: pnpm content translate <slug> <locale>")
  if (!locales.includes(locale) || locale === defaultLocale) {
    fail(`Translate into one of: ${locales.filter(code => code !== defaultLocale).join(", ")}.`)
  }
  const source = blogPostPath(slug)
  if (!existsSync(source)) fail(`There's no post at ${source}.`)
  const { data, body } = readEntry(source)
  // The copy is the starting point you translate over; the dates and featured flag stay shared
  create(blogPostPath(slug, locale), translationFrontmatter(data), body)
  console.log(
    `Translate the title, summary, tags and body. Delete the file to drop the translation.`
  )
}

function addImages([target, ...files]) {
  const media = target && parseMediaTarget(target)
  if (!media || !files.length)
    fail("Usage: pnpm content image <blog/<slug>|projects/<slug>|byo/<course>|work> <files...>")
  const entryFile = {
    blog: () => blogPostPath(media.slug),
    projects: () => `${contentDirectories.projects}/${media.slug}.mdx`,
    byo: () => byoEntryPath(defaultLocale, media.slug),
    work: () => undefined,
  }[media.collection]()
  if (entryFile && !existsSync(entryFile)) fail(`There's no entry at ${entryFile}.`)

  const added = files.map(file => {
    const src = copyImage(file, mediaFolder(media))
    return { src, alt: options.alt ?? altFromFileName(path.basename(src)) }
  })
  if (media.collection === "projects") {
    const { data, body } = readEntry(entryFile)
    writeFileSync(
      entryFile,
      stringifyMdx({ ...data, gallery: [...(data.gallery ?? []), ...added] }, body)
    )
    console.log(
      `Added ${added.length} image(s) to the gallery in ${entryFile}. Check the alt text.`
    )
  } else if (media.collection === "work") {
    console.log(`Use it as logoUrl: ${added.map(image => image.src).join(", ")}`)
  } else {
    console.log("Paste into the body, then fix the alt text:")
    for (const image of added) console.log(`  ![${image.alt}](${image.src})`)
  }
}

function run(command, args) {
  // pnpm is a .cmd shim on Windows, which only runs in a shell. Its arguments here are fixed words, so
  // the command line is joined up front. git and gh never get a shell, which would split the commit
  // message at spaces
  const result =
    process.platform === "win32" && command === "pnpm"
      ? spawnSync([command, ...args].join(" "), { stdio: "inherit", shell: true })
      : spawnSync(command, args, { stdio: "inherit" })
  if (result.status !== 0) fail(`${command} ${args.slice(0, 2).join(" ")} failed.`)
}

async function openPullRequest() {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim()
  const changes = git("status", "--porcelain", "--", "src/data", "public")
  if (!changes) fail("There are no changes in src/data or public/ to publish.")
  const others = git("status", "--porcelain")
    .split("\n")
    .filter(line => line && !changes.includes(line))
  if (others.length) console.log(`Only content is committed. Left out:\n${others.join("\n")}`)

  const title =
    options.title ?? (await ask("PR title", { fallback: "content(blog): add post on ..." }))
  if (!isConventionalTitle(title)) {
    fail(`"${title}" must look like "content(scope): lowercase summary" with no trailing period.`)
  }

  run("pnpm", ["content:check"])
  if (!options["no-build"]) run("pnpm", ["exec", "astro", "build"])

  let branch = git("branch", "--show-current")
  if (!branch || branch === "preview" || branch === "main") {
    branch = branchForTitle(title)
    git("switch", "-c", branch)
    console.log(`Created branch ${branch}`)
  }
  git("add", "--", "src/data", "public")
  run("git", ["commit", "-m", title])
  run("git", ["push", "-u", "origin", branch])

  const template = readFileSync(".github/pull_request_template.md", "utf8")
    .replace("- [ ] Content:", "- [x] Content:")
    .replace(
      "- [ ] Production build passes",
      options["no-build"] ? "- [ ] Production build passes" : "- [x] Production build passes"
    )
  run("gh", [
    "pr",
    "create",
    "--base",
    "preview",
    "--head",
    branch,
    "--title",
    title,
    "--body",
    template,
  ])
}

const commands = {
  new: ([type]) => {
    const creators = {
      blog: newBlogPost,
      work: newWorkEntry,
      project: newProject,
      course: newCourse,
      lesson: () => newCourseEntry("lesson"),
      guide: () => newCourseEntry("guide"),
      exercise: () => newCourseEntry("exercise"),
    }
    if (!creators[type]) fail(`Usage: pnpm content new <${Object.keys(creators).join("|")}>`)
    return creators[type]()
  },
  translate,
  image: addImages,
  check: () => run("pnpm", ["content:check"]),
  pr: openPullRequest,
}

const [command, ...rest] = positionals
try {
  if (options.help || !command || command === "help") console.log(usage)
  else if (!commands[command]) fail(`Unknown command "${command}".\n\n${usage}`)
  else await commands[command](rest)
} catch (error) {
  if (!(error instanceof UserError)) throw error
  console.error(error.message)
  process.exitCode = 1
} finally {
  prompt?.close()
}
