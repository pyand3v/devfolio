import { defineConfig, globalIgnores } from "eslint/config"
import prettier from "eslint-config-prettier/flat"

/**
 * ESLint configuration for the framework-agnostic Astro source files.
 */
const eslintConfig = defineConfig([
  prettier,
  globalIgnores([
    "dist/**",
    "playwright-report/**",
    "test-results/**",
    ".astro/**",
    ".next/**",
    "node_modules/**",
    "public/**",
    "coverage/**",
  ]),
])

export default eslintConfig
