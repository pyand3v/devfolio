import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: "node",
    // e2e/ holds the Playwright specs, run by `pnpm test:e2e`
    include: ["tests/**/*.test.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.config.ts",
        "src/pages/**",
        "src/types/**",
        "src/components/ui/**",
        // Plain configuration objects, no logic
        "src/data/site.ts",
        "src/data/portfolio.ts",
      ],
      // A floor just under current coverage, so it can't quietly drop. Raise it as coverage grows.
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 95,
        branches: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDirectory, "./src"),
    },
  },
})
