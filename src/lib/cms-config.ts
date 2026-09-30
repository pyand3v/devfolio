// Sveltia CMS configuration, served as /admin/config.yml by src/pages/admin/config.yml.ts. Collections
// mirror the content model in schemas.ts; tests/lib/cms-config.test.ts checks they stay in sync.
import { defaultLocale, locales } from "@/lib/i18n"
import { contentDirectories } from "@/lib/schemas"

export const cmsRepository = "pyand3v/devfolio"

type Field = Record<string, unknown> & { name: string }
type Collection = Record<string, unknown> & { name: string; fields: Field[] }

// Field-level i18n: `true` is translated per locale, `duplicate` is set once in the default locale and
// copied to every locale file, and `false` is stored only in the default-locale file.
const translated = { i18n: true }
const shared = { i18n: "duplicate" }

const string = (name: string, label: string, extra: Record<string, unknown> = {}): Field => ({
  name,
  label,
  widget: "string",
  ...extra,
})
const text = (name: string, label: string, extra: Record<string, unknown> = {}): Field => ({
  name,
  label,
  widget: "text",
  ...extra,
})
const stringList = (name: string, label: string, extra: Record<string, unknown> = {}): Field => ({
  name,
  label,
  widget: "list",
  hint: "Separate items with commas.",
  ...extra,
})
// Raw Markdown first: entries can contain MDX components and HTML, which the rich text editor may not
// keep intact. Switch to rich text per entry when it only has plain Markdown.
const body = (extra: Record<string, unknown> = {}): Field => ({
  name: "body",
  label: "Body",
  widget: "richtext",
  modes: ["raw", "rich_text"],
  required: false,
  ...extra,
})
const month = (name: string, label: string): Field =>
  string(name, label, { pattern: ["^\\d{4}-\\d{2}$", "Use YYYY-MM, e.g. 2024-06"] })
const hiddenType = (type: string): Field => ({
  name: "type",
  widget: "hidden",
  default: type,
  ...shared,
})
const order = (label: string): Field => ({
  name: "order",
  label,
  widget: "number",
  value_type: "int",
  min: 1,
  ...shared,
})
// A BYO entry type stored in its course's folder next to project.mdx, told apart by its `type` field.
// It's a nested collection because the courses reuse file names (lesson-01, ...), and only a nested
// collection tells entries apart by their folder. The folder you pick when creating an entry is its
// course.
const byoCollection = (
  name: string,
  label: string,
  labelSingular: string,
  fields: Field[]
): Collection => ({
  name: `byo_${name}`,
  label,
  label_singular: labelSingular,
  folder: contentDirectories.byo,
  nested: { depth: 2, subfolders: false },
  meta: { path: { label: "Course" } },
  filter: { field: "type", value: name.replace(/s$/, "") },
  extension: "mdx",
  format: "yaml-frontmatter",
  i18n: true,
  slug: "{{title}}",
  summary: "{{order}}. {{title}}",
  sortable_fields: ["order", "title"],
  media_folder: "/public/byo/{{dirname}}",
  public_folder: "/byo/{{dirname}}",
  preview_path: `{{locale}}/byo/{{dirname}}/${name}/{{slug}}`,
  fields,
})

export const collections: Collection[] = [
  {
    name: "blog",
    label: "Blog posts",
    label_singular: "Blog post",
    description: `Write the ${defaultLocale} version first, then add translations.`,
    folder: contentDirectories.blog,
    extension: "mdx",
    format: "yaml-frontmatter",
    // New posts start in the default locale only; enable other locales when translating
    i18n: { initial_locales: [defaultLocale] },
    slug: "{{title}}",
    summary: "{{title}}",
    sortable_fields: {
      fields: ["publishedAt", "title"],
      default: { field: "publishedAt", direction: "descending" },
    },
    media_folder: "/public/blog/{{slug}}",
    public_folder: "/blog/{{slug}}",
    preview_path: "{{locale}}/blog/{{slug}}",
    fields: [
      string("title", "Title", translated),
      text("summary", "Summary", translated),
      stringList("tags", "Tags", { required: false, ...translated }),
      {
        name: "featured",
        label: "Featured",
        widget: "boolean",
        default: false,
        required: false,
        hint: "Only featured posts are listed on the blog and home page.",
        i18n: false,
      },
      {
        name: "publishedAt",
        label: "Published",
        widget: "datetime",
        default: "{{now}}",
        format: "YYYY-MM-DDTHH:mm:ssZ",
        i18n: false,
      },
      {
        name: "updatedAt",
        label: "Updated",
        widget: "datetime",
        format: "YYYY-MM-DDTHH:mm:ssZ",
        required: false,
        hint: "Leave empty until you revise the post.",
        i18n: false,
      },
      body(translated),
    ],
  },
  {
    name: "work",
    label: "Work",
    label_singular: "Work entry",
    folder: contentDirectories.work,
    extension: "mdx",
    format: "yaml-frontmatter",
    slug: "{{fields.title}}-{{fields.company}}",
    identifier_field: "company",
    summary: "{{company}} · {{title}}",
    media_folder: "/public/work",
    public_folder: "/work",
    preview_path: "work/{{slug}}",
    fields: [
      string("company", "Company"),
      string("title", "Role"),
      string("start", "Start", { hint: 'For example "Jan 2024".' }),
      string("end", "End", { default: "Present", hint: 'For example "Jun 2025", or "Present".' }),
      text("description", "One-line description"),
      stringList("locations", "Locations"),
      { name: "logoUrl", label: "Logo", widget: "image", required: false },
      string("companyUrl", "Company website", { required: false }),
      stringList("techStack", "Tech stack", { required: false }),
      body(),
    ],
  },
  {
    name: "projects",
    label: "Projects",
    label_singular: "Project",
    folder: contentDirectories.projects,
    extension: "mdx",
    format: "yaml-frontmatter",
    slug: "{{title}}",
    summary: "{{title}} ({{startDate}})",
    sortable_fields: {
      fields: ["startDate", "title"],
      default: { field: "startDate", direction: "descending" },
    },
    media_folder: "/public/projects/{{slug}}",
    public_folder: "/projects/{{slug}}",
    preview_path: "projects/{{slug}}",
    fields: [
      string("title", "Title"),
      { name: "image", label: "Cover image", widget: "image" },
      text("description", "One-line description"),
      month("startDate", "Start month"),
      month("endDate", "End month"),
      stringList("techStack", "Tech stack"),
      {
        name: "teamSize",
        label: "Team size",
        widget: "number",
        value_type: "int",
        min: 1,
        required: false,
      },
      string("role", "Role", { required: false }),
      string("githubUrl", "GitHub URL", { required: false }),
      string("paperUrl", "Paper URL", { required: false }),
      {
        name: "gallery",
        label: "Gallery",
        label_singular: "Image",
        widget: "list",
        required: false,
        summary: "{{fields.alt}}",
        fields: [
          { name: "src", label: "Image", widget: "image" },
          string("alt", "Alt text", { hint: "Describe what the image shows." }),
        ],
      },
      body(),
    ],
  },
  {
    name: "byo_courses",
    label: "BYO courses",
    label_singular: "BYO course",
    description: "Every course, lesson, guide and exercise must exist in every locale.",
    folder: contentDirectories.byo,
    path: "{{slug}}/project",
    filter: { field: "type", value: "project" },
    extension: "mdx",
    format: "yaml-frontmatter",
    i18n: true,
    slug: "{{title}}",
    summary: "{{title}}",
    media_folder: "/public/byo/{{slug}}",
    public_folder: "/byo/{{slug}}",
    preview_path: "{{locale}}/byo/{{slug}}",
    fields: [
      hiddenType("project"),
      string("title", "Title", translated),
      text("description", "One-line description", translated),
      {
        name: "estimatedMinutes",
        label: "Estimated minutes",
        widget: "number",
        value_type: "int",
        min: 1,
        ...shared,
      },
      {
        name: "chapters",
        label: "Chapters",
        label_singular: "Chapter",
        widget: "list",
        summary: "{{fields.order}}. {{fields.title}}",
        min: 1,
        ...translated,
        fields: [
          { name: "order", label: "Number", widget: "number", value_type: "int", min: 1 },
          string("title", "Title"),
          text("description", "Description", { required: false }),
        ],
      },
      body(translated),
    ],
  },
  byoCollection("lessons", "BYO lessons", "BYO lesson", [
    hiddenType("lesson"),
    {
      name: "chapter",
      label: "Chapter",
      widget: "number",
      value_type: "int",
      min: 1,
      hint: "The number of one of the course's chapters.",
      ...shared,
    },
    order("Lesson number"),
    string("title", "Title", translated),
    text("description", "One-line description", translated),
    body(translated),
  ]),
  byoCollection("guides", "BYO guides", "BYO guide", [
    hiddenType("guide"),
    order("Position"),
    string("title", "Title", translated),
    text("description", "One-line description", translated),
    body(translated),
  ]),
  byoCollection("exercises", "BYO exercises", "BYO exercise", [
    hiddenType("exercise"),
    order("Position"),
    {
      name: "difficulty",
      label: "Difficulty",
      widget: "select",
      options: ["easy", "medium", "hard"],
      default: "medium",
      ...shared,
    },
    string("title", "Title", translated),
    text("description", "One-line description", translated),
    body(translated),
  ]),
]

export function cmsConfig(siteUrl: string) {
  return {
    backend: {
      name: "github",
      repo: cmsRepository,
      // Every change goes through a pull request into preview, like any other change
      branch: "preview",
      squash_merges: true,
      // Pull requests are titled with the create/update/delete message, so these pass the PR Title check
      commit_messages: {
        create: "content: add {{slug}}",
        update: "content: update {{slug}}",
        delete: "content: remove {{slug}}",
        uploadMedia: "content: upload {{path}}",
        deleteMedia: "content: delete {{path}}",
      },
    },
    publish_mode: "editorial_workflow",
    site_url: siteUrl,
    display_url: siteUrl,
    media_folder: "public/uploads",
    public_folder: "/uploads",
    slug: { encoding: "ascii", clean_accents: true },
    // Leave out empty optional fields instead of writing `updatedAt: ''`, which the schemas reject
    output: { omit_empty_optional_fields: true },
    i18n: {
      structure: "multiple_folders",
      locales: [...locales],
      default_locale: defaultLocale,
      // The default locale is served at the site root, e.g. /blog/post rather than /en/blog/post
      omit_default_locale_from_preview_path: true,
    },
    collections,
  }
}
