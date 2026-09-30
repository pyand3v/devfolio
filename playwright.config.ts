import { defineConfig, devices } from "@playwright/test"

const port = 4321
const isCI = Boolean(process.env.CI)

/**
 * End-to-end tests against the production build: `pnpm build` first, then `pnpm test:e2e` serves dist/ with
 * `astro preview` and runs the specs in e2e/ in Chromium.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
  },
})
