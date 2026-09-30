import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

// WCAG 2.2 A and AA, which Lighthouse only partly covers
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
  const summary = violations.map(
    violation =>
      `${violation.id} (${violation.impact}): ${violation.help}\n  ${violation.nodes
        .map(node => node.target.join(" "))
        .join("\n  ")}`
  )
  expect(summary).toEqual([])
}

// The inline locale redirect sends visitors to their stored locale, so pin it before any page loads
async function useLocale(page: Page, locale: string) {
  await page.addInitScript(value => localStorage.setItem("preferred-locale", value), locale)
}

const pages = [
  "/",
  "/work",
  "/projects",
  "/projects/younovate",
  "/blog",
  "/blog/concurrency-in-java",
  "/blog/tag/java",
  "/byo",
  "/byo/build-your-own-developer-tool",
  "/byo/build-your-own-developer-tool/lessons/lesson-01",
]

test.describe("axe", () => {
  for (const path of pages) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path)
      await expectNoViolations(page)
    })
  }

  test("a translated page has no violations", async ({ page }) => {
    await useLocale(page, "es")
    await page.goto("/es/blog/concurrency-in-java")
    await expect(page.locator("html")).toHaveAttribute("lang", "es")
    await expectNoViolations(page)
  })

  test("the open language menu has no violations", async ({ page }) => {
    await page.goto("/blog")
    await page.locator("header details summary").click()
    await expect(page.locator("header details")).toHaveAttribute("open", "")
    await expectNoViolations(page)
  })

  test("the open tag filter with a tag selected has no violations", async ({ page }) => {
    await page.goto("/blog?tags=java")
    await page.locator(".blog-filter-menu summary").click()
    await expect(page.locator(".blog-filter-selected button")).toHaveCount(1)
    await expectNoViolations(page)
  })

  test("the open mobile menu has no violations", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")
    await page.locator("#mobile-menu-toggle").click()
    await expect(page.locator("#mobile-menu")).toBeVisible()
    await expectNoViolations(page)
  })
})

// axe checks what's on the page, not how a keyboard moves through it
test.describe("keyboard", () => {
  test("the language switcher opens from the keyboard and its options follow in order", async ({
    page,
  }) => {
    await page.goto("/blog")
    const summary = page.locator("header details summary")
    await summary.focus()
    await page.keyboard.press("Enter")
    await expect(page.locator("header details")).toHaveAttribute("open", "")

    for (const locale of ["en", "es", "pt-br"]) {
      await page.keyboard.press("Tab")
      await expect(page.locator(":focus")).toHaveAttribute("data-locale-option", locale)
    }
  })

  test("the tag filter is usable from the keyboard alone", async ({ page }) => {
    await page.goto("/blog")
    const posts = page.locator(".blog-post-item")
    const total = await posts.count()

    await page.locator(".blog-filter-menu summary").focus()
    await page.keyboard.press("Enter")
    await page.keyboard.press("Tab")
    await expect(page.locator(":focus")).toHaveClass(/blog-filter-search/)

    await page.keyboard.type("java")
    await page.keyboard.press("Tab")
    const focused = page.locator(":focus")
    await expect(focused).toHaveClass(/blog-filter-input/)
    const tag = await focused.inputValue()
    expect(tag).toContain("java")

    await page.keyboard.press("Space")
    await expect(page).toHaveURL(new RegExp(`[?&]tags=${tag}`))
    await expect(posts.locator("visible=true")).not.toHaveCount(total)
    await expect(page.locator(".blog-filter-selected button")).toHaveCount(1)
  })
})
