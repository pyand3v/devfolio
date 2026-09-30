#!/usr/bin/env bash
# Checks that a PR title follows Conventional Commits, e.g. `feat(blog): add tag filter`.
# Usage: check-pr-title.sh "<title>". Used by the PR Title and Promote workflows.
set -euo pipefail

title="$1"
types="feat|fix|content|docs|style|refactor|perf|test|build|ci|chore|revert"
pattern="^($types)(\([a-z0-9./-]+\))?!?: [^ ].*[^.]$"

if [[ "$title" =~ $pattern ]]; then
  echo "PR title follows Conventional Commits: $title"
  exit 0
fi

echo "::error title=Invalid PR title::'$title' must look like 'type(scope): summary'"
{
  echo "### PR title doesn't follow Conventional Commits"
  echo
  echo "Got: \`$title\`"
  echo
  echo "Expected \`type(optional-scope): summary\`, with a lowercase imperative summary and no"
  echo "trailing period. Allowed types: \`${types//|/\`, \`}\`."
  echo
  echo "Examples: \`feat(blog): add tag filter\`, \`fix(i18n): translate 404 page\`,"
  echo "\`chore(deps): bump astro from 7.2.2 to 7.3.5\`. Append \`!\` before the colon for breaking changes."
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
exit 1
