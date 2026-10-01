// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest"
import source from "@/scripts/byo-progress.js?raw"

const lessons = ["lesson-01", "lesson-02", "lesson-03"]

const block = (attributes = "") => `
  <section data-byo-course="dev-tool" data-byo-total="3" ${attributes}>
    ${lessons
      .map(
        (slug, index) =>
          `<a class="stop" href="/byo/dev-tool/lessons/${slug}" data-byo-stop="${slug}" data-number="${index + 1}"></a>
           <span data-byo-left-off="${slug}" hidden></span>`
      )
      .join("")}
    <a id="start" data-byo-fresh href="/byo/dev-tool/lessons/lesson-01">Start</a>
    <a id="continue" data-byo-continue data-label="Continue lesson" href="/byo/dev-tool" hidden>
      <span data-text></span>
    </a>
    <p id="count" data-byo-count data-label="opened" hidden></p>
    <button id="reset" data-byo-reset hidden>Reset</button>
  </section>
`

// The page renders the script inline, as a classic script; run the same source. Without a currentScript
// it sets up every block on the page itself.
function run(html: string) {
  document.body.innerHTML = html
  new Function(source)()
}

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!
const stop = (slug: string) => $(`[data-byo-stop="${slug}"]`)
const saved = () => JSON.parse(localStorage.getItem("byo-progress") ?? "{}")

describe("BYO progress", () => {
  beforeEach(() => localStorage.clear())

  it("shows a fresh course as not started", () => {
    run(block())
    expect($("section").hasAttribute("data-has-progress")).toBe(false)
    expect($("#start").hidden).toBe(false)
    expect($("#continue").hidden).toBe(true)
    expect($("#count").hidden).toBe(true)
    expect($("#reset").hidden).toBe(true)
  })

  it("records a lesson visit and marks it as where the visitor is", () => {
    run(block('data-byo-visit="lesson-02"'))
    expect(saved()).toEqual({ "dev-tool": { visited: ["lesson-02"], last: "lesson-02" } })
    expect(stop("lesson-02").hasAttribute("data-current")).toBe(true)
    expect(stop("lesson-02").hasAttribute("data-visited")).toBe(true)
    expect(stop("lesson-01").hasAttribute("data-visited")).toBe(false)
  })

  it("keeps earlier visits and moves the current lesson", () => {
    localStorage.setItem(
      "byo-progress",
      JSON.stringify({ "dev-tool": { visited: ["lesson-01", "lesson-02"], last: "lesson-02" } })
    )
    run(block('data-byo-visit="lesson-01"'))
    expect(saved()["dev-tool"]).toEqual({ visited: ["lesson-01", "lesson-02"], last: "lesson-01" })
    expect(stop("lesson-01").hasAttribute("data-current")).toBe(true)
    expect(stop("lesson-02").hasAttribute("data-current")).toBe(false)
    expect(stop("lesson-02").hasAttribute("data-visited")).toBe(true)
  })

  it("offers to continue from the last lesson opened", () => {
    localStorage.setItem(
      "byo-progress",
      JSON.stringify({ "dev-tool": { visited: ["lesson-01", "lesson-03"], last: "lesson-03" } })
    )
    run(block())
    expect($("#start").hidden).toBe(true)
    expect($("#continue").hidden).toBe(false)
    expect($<HTMLAnchorElement>("#continue").getAttribute("href")).toBe(
      "/byo/dev-tool/lessons/lesson-03"
    )
    expect($("#continue").textContent?.trim()).toBe("Continue lesson 3")
    expect($("#count").textContent).toBe("2/3 opened")
    expect($('[data-byo-left-off="lesson-03"]').hidden).toBe(false)
    expect($('[data-byo-left-off="lesson-01"]').hidden).toBe(true)
  })

  it("ignores lessons that no longer exist and unreadable storage", () => {
    localStorage.setItem(
      "byo-progress",
      JSON.stringify({ "dev-tool": { visited: ["removed-lesson"], last: "removed-lesson" } })
    )
    run(block())
    expect($("section").hasAttribute("data-has-progress")).toBe(false)
    expect($("#continue").hidden).toBe(true)

    localStorage.setItem("byo-progress", "not json")
    run(block())
    expect($("#start").hidden).toBe(false)
  })

  it("forgets a course on reset", () => {
    localStorage.setItem(
      "byo-progress",
      JSON.stringify({
        "dev-tool": { visited: ["lesson-01"], last: "lesson-01" },
        other: { visited: ["lesson-01"], last: "lesson-01" },
      })
    )
    run(block())
    $("#reset").click()
    expect(saved()).toEqual({ other: { visited: ["lesson-01"], last: "lesson-01" } })
    expect($("#continue").hidden).toBe(true)
    expect($("#start").hidden).toBe(false)
    expect(stop("lesson-01").hasAttribute("data-visited")).toBe(false)
  })
})
