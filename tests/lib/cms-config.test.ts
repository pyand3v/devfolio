import { readFileSync } from "node:fs"
import path from "node:path"
import Ajv from "ajv"
import { describe, it, expect } from "vitest"
import { cmsConfig, collections } from "@/lib/cms-config"
import { isConventionalTitle } from "@/lib/content-files"
import {
  BlogPostSchema,
  ByoEntrySchema,
  contentDirectories,
  ProjectSchema,
  WorkItemSchema,
} from "@/lib/schemas"

const config = cmsConfig("https://example.com")
const collection = (name: string) => collections.find(item => item.name === name)!
// Frontmatter keys a collection's CMS fields write (the body isn't frontmatter)
const fieldNames = (name: string) =>
  collection(name)
    .fields.map(field => field.name)
    .filter(field => field !== "body")
    .sort()
// Schema keys minus the ones that come from the file path
const schemaKeys = (shape: object, fromPath: string[]) =>
  Object.keys(shape)
    .filter(key => !fromPath.includes(key))
    .sort()
const byoShape = (type: string) =>
  ByoEntrySchema.options.find(option => option.shape.type.value === type)!.shape

describe("cmsConfig", () => {
  it("is valid according to Sveltia CMS's JSON schema", () => {
    const schemaFile = path.resolve("node_modules/@sveltia/cms/schema/sveltia-cms.json")
    const validate = new Ajv({ strict: false, allErrors: true, validateFormats: false }).compile(
      JSON.parse(readFileSync(schemaFile, "utf8"))
    )
    expect(validate(config), JSON.stringify(validate.errors, null, 2)).toBe(true)
  })

  it("opens a pull request into preview for every change", () => {
    expect(config.backend).toMatchObject({ name: "github", branch: "preview", squash_merges: true })
    expect(config.publish_mode).toBe("editorial_workflow")
    expect(config.site_url).toBe("https://example.com")
  })

  it("titles pull requests so they pass the PR Title check", () => {
    const { create, update, delete: remove } = config.backend.commit_messages
    for (const template of [create, update, remove]) {
      const title = template.replace("{{slug}}", "my-post")
      expect(isConventionalTitle(title), title).toBe(true)
      // More than one file adds " +N" to the message
      expect(isConventionalTitle(`${title} +2`)).toBe(true)
    }
  })

  it("stores content in the collection directories", () => {
    expect(collection("blog").folder).toBe(contentDirectories.blog)
    expect(collection("work").folder).toBe(contentDirectories.work)
    expect(collection("projects").folder).toBe(contentDirectories.projects)
    for (const name of ["byo_courses", "byo_lessons", "byo_guides", "byo_exercises"]) {
      expect(collection(name).folder).toBe(contentDirectories.byo)
    }
  })
})

describe("CMS fields", () => {
  it("cover every blog post field", () => {
    expect(fieldNames("blog")).toEqual(schemaKeys(BlogPostSchema.shape, ["locale", "slug"]))
  })

  it("cover every work and project field", () => {
    expect(fieldNames("work")).toEqual(schemaKeys(WorkItemSchema.shape, ["slug"]))
    expect(fieldNames("projects")).toEqual(schemaKeys(ProjectSchema.shape, ["slug"]))
  })

  it("cover every field of each BYO entry type", () => {
    expect(fieldNames("byo_courses")).toEqual(schemaKeys(byoShape("project"), ["locale", "slug"]))
    for (const type of ["lesson", "guide", "exercise"]) {
      expect(fieldNames(`byo_${type}s`)).toEqual(
        schemaKeys(byoShape(type), ["locale", "slug", "project"])
      )
      expect(collection(`byo_${type}s`).filter).toEqual({ field: "type", value: type })
    }
    expect(collection("byo_courses").filter).toEqual({ field: "type", value: "project" })
  })

  it("keep the fields every blog translation shares in the default-locale file", () => {
    const shared = collection("blog").fields.filter(field => field.i18n === false)
    expect(shared.map(field => field.name).sort()).toEqual(["featured", "publishedAt", "updatedAt"])
  })
})
