import { expect, test, type Page } from "@playwright/test"

// Smoke tests for the behaviour that lives in src/scripts/ and only runs in a browser: the inline locale
// redirect, the language switcher, the blog tag filter, the mobile menu and the theme.

const visiblePosts = (page: Page) => page.locator(".blog-post-item:visible")

test.describe("locale redirect", () => {
  test.describe("with a Spanish browser", () => {
    test.use({ locale: "es-ES" })

    test("serves the Spanish page under the unprefixed URL", async ({ page }) => {
      await page.goto("/blog")
      await expect(page.locator("html")).toHaveAttribute("lang", "es")
      await expect(page.locator(".blog-filter-summary")).toHaveText("Todos los artículos")
      await expect(page).toHaveURL(/\/blog$/)
    })

    test("sends English-only pages to the localized list", async ({ page }) => {
      await page.goto("/projects/younovate")
      await expect(page.locator("html")).toHaveAttribute("lang", "es")
      await expect(page).toHaveURL(/\/projects$/)
    })
  })

  test.describe("with a Brazilian Portuguese browser", () => {
    test.use({ locale: "pt-BR" })

    test("serves the Portuguese page", async ({ page }) => {
      await page.goto("/")
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-br")
    })
  })

  test.describe("with an English browser", () => {
    test.use({ locale: "en-US" })

    test("leaves English pages alone", async ({ page }) => {
      await page.goto("/blog/concurrency-in-java")
      await expect(page.locator("html")).toHaveAttribute("lang", "en")
      await expect(page).toHaveURL(/\/blog\/concurrency-in-java$/)
    })

    test("keeps a localized URL in its language and remembers it", async ({ page }) => {
      await page.goto("/es/blog")
      await expect(page.locator("html")).toHaveAttribute("lang", "es")
      expect(await page.evaluate(() => localStorage.getItem("preferred-locale"))).toBe("es")
    })

    test("sends a localized URL to a stored choice", async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("preferred-locale", "en"))
      await page.goto("/es/blog")
      await expect(page.locator("html")).toHaveAttribute("lang", "en")
      await expect(page).toHaveURL(/\/blog$/)
    })

    test("prefers a stored choice over the browser language", async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("preferred-locale", "pt-br"))
      await page.goto("/work")
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-br")
    })
  })
})

test.describe("language switcher", () => {
  test("switches locale, remembers it and keeps internal links in it", async ({ page }) => {
    await page.goto("/blog/concurrency-in-java")
    await page.locator("header details summary").click()
    await page.locator('header details [data-locale-option="es"]').click()

    await expect(page.locator("html")).toHaveAttribute("lang", "es")
    expect(await page.evaluate(() => localStorage.getItem("preferred-locale"))).toBe("es")

    // The desktop header nav: its label is translated, so find it by the link instead
    await page.locator('header nav:visible a[href="/work"]').click()
    await expect(page.locator("html")).toHaveAttribute("lang", "es")
    await expect(page).toHaveURL(/\/work$/)
  })
})

test.describe("blog tag filter", () => {
  test("filters by a tag, keeps it in the URL and clears it", async ({ page }) => {
    await page.goto("/blog")
    const total = await visiblePosts(page).count()
    expect(total).toBeGreaterThan(1)
    await expect(page.locator(".blog-filter-count")).toHaveText(`${total} articles shown`)

    await page.locator(".blog-filter-menu summary").click()
    await page.locator(".blog-filter-option", { hasText: /^java/ }).first().click()
    await expect(page).toHaveURL(/\?tags=java$/)
    const filtered = await visiblePosts(page).count()
    expect(filtered).toBeGreaterThan(0)
    expect(filtered).toBeLessThan(total)
    for (const tags of await visiblePosts(page).evaluateAll(items =>
      items.map(item => (item as HTMLElement).dataset.tags ?? "")
    )) {
      expect(tags.split("|")).toContain("java")
    }
    await expect(page.locator(".blog-filter-summary")).toHaveText(/^1 /)

    await page.locator(".blog-filter-clear").click()
    await expect(page).toHaveURL(/\/blog$/)
    await expect(visiblePosts(page)).toHaveCount(total)
  })

  test("restores the filter from the URL and from history", async ({ page }) => {
    await page.goto("/blog?tags=java")
    const filtered = await visiblePosts(page).count()
    await page.locator(".blog-filter-menu summary").click()
    await expect(page.locator(".blog-filter-input[value='java']")).toBeChecked()

    await page.locator(".blog-filter-selected button").click()
    await expect(page).toHaveURL(/\/blog$/)
    await expect(visiblePosts(page)).not.toHaveCount(filtered)

    await page.goBack()
    await expect(page).toHaveURL(/\?tags=java$/)
    await expect(visiblePosts(page)).toHaveCount(filtered)
  })

  test("searches the tag list and says when nothing matches", async ({ page }) => {
    await page.goto("/blog")
    await page.locator(".blog-filter-menu summary").click()
    const search = page.locator(".blog-filter-search")

    await search.fill("jav")
    await expect(page.locator(".blog-filter-option:visible")).not.toHaveCount(0)
    for (const value of await page
      .locator(".blog-filter-option:visible input")
      .evaluateAll(inputs => inputs.map(input => (input as HTMLInputElement).value))) {
      expect(value).toContain("jav")
    }

    await search.fill("no-such-topic")
    await expect(page.locator(".blog-filter-option:visible")).toHaveCount(0)
    await expect(page.locator(".blog-filter-no-matches")).toBeVisible()
  })
})

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test("opens and closes, and reports its state", async ({ page }) => {
    await page.goto("/")
    const toggle = page.locator("#mobile-menu-toggle")
    const menu = page.locator("#mobile-menu")

    await expect(menu).toBeHidden()
    await toggle.click()
    await expect(menu).toBeVisible()
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await toggle.click()
    await expect(menu).toBeHidden()
    await expect(toggle).toHaveAttribute("aria-expanded", "false")
  })

  test("fits the viewport without horizontal scroll", async ({ page }) => {
    for (const path of ["/", "/work", "/projects", "/blog", "/blog/concurrency-in-java", "/byo"]) {
      await page.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
      expect(overflow, path).toBeLessThanOrEqual(0)
    }
  })
})

test.describe("theme", () => {
  // Graph paper in light, a navy blueprint in dark
  const paper = { light: "rgb(247, 245, 239)", dark: "rgb(14, 26, 51)" }

  for (const colorScheme of ["light", "dark"] as const) {
    test(`follows a ${colorScheme} system theme until one is picked`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      await page.goto("/")
      await expect(page.locator("html")).toHaveAttribute("data-theme", colorScheme)
      await expect(page.locator("body")).toHaveCSS("background-color", paper[colorScheme])
    })
  }

  test("switches theme from the toggle and keeps it across pages", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" })
    await page.goto("/")
    await page.locator("#theme-toggle").click()
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
    await expect(page.locator("body")).toHaveCSS("background-color", paper.dark)

    await page.goto("/blog")
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
    await expect(page.locator("#theme-toggle")).toHaveAttribute("aria-label", /light/i)
  })
})
