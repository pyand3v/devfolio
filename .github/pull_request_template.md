[//]: # "Title format: type(scope): summary, e.g. feat(blog): add tag filter. See AGENTS.md."

## Description

[//]: # "Summarize the change, why it's needed, and link the issue it closes (e.g. Closes #12)."

## Type of Change

[//]: # "Please select one"

- [ ] Feature (`feat`)
- [ ] Bugfix (`fix`)
- [ ] Content: blog, work, projects, BYO (`content`)
- [ ] Refactor (`refactor`)
- [ ] Documentation (`docs`)
- [ ] CI / tooling / dependencies (`ci`, `build`, `chore`)
- [ ] Other (`perf`, `test`, `style`, `revert`)

## Checklist

[//]: # "Please check all that apply"

- [ ] Manually tested with `pnpm dev`, including every locale (`en`, `es`, `pt-br`) the change touches
- [ ] Production build passes with `pnpm build`
- [ ] No Prettier issues (`pnpm format:check`)
- [ ] No ESLint warnings or errors (`pnpm lint:check`)
- [ ] No type errors (`pnpm types:check`)
- [ ] Tests pass (`pnpm test`), and new logic in `src/lib/` has tests
- [ ] New UI text is translated in `src/lib/i18n.ts` for all locales
- [ ] No console warnings or errors in the browser
- [ ] `AGENTS.md` / docs updated if commands, structure, or conventions changed

## Screenshots

[//]: # "Required for UI changes: before/after on desktop and mobile. Delete this section otherwise."

## Supplementary Information

[//]: # "Anything else reviewers should know."
