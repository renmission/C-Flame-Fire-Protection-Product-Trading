---
description: Review the current work for correctness, risk, and missing coverage
allowed-tools: Read, Grep, Glob, Bash
---

# Review Command

Review the current project changes with a senior-engineer mindset.

## Arguments

`$ARGUMENTS`

If arguments are provided, treat them as extra review focus areas. If no arguments are provided, review all current unstaged, staged, and recently changed work that is visible in the repository.

## Review goals

Produce a concise, high-signal review that finds real issues before merge.

Focus on:

1. Correctness and regressions.
2. Security issues and unsafe data handling.
3. API contract mismatches and edge-case behavior.
4. Next.js App Router conventions, including Route Handler and Server Component boundaries.
5. Performance issues, unnecessary client-side rendering, and avoidable data-fetch churn.
6. Accessibility and UX regressions in interactive UI.
7. Missing tests or weak test coverage.
8. Violations of project rules in `.claude/rules/`, especially testing and API conventions.

## Process

1. Read the relevant project rules in `.claude/rules/` before reviewing code.
2. Inspect git status and recent diffs to determine the review target.
3. Read changed files fully when practical; do not rely only on snippets.
4. For each issue, verify it against actual code before reporting it.
5. Prefer fewer high-confidence findings over many speculative comments.

## Output format

Return these sections in order:

### Verdict

One short paragraph with the overall assessment.

### Findings

Use bullets ordered by severity.
For each finding, include:

- Severity: `high`, `medium`, or `low`
- File path and, if practical, line or section reference
- What is wrong
- Why it matters
- The concrete fix

### Test gaps

List missing or weak tests tied to the changed behavior.

### Nice-to-have

Optional small improvements only if they are clearly lower priority than the main findings.

## Review style

- Be direct and specific.
- Do not praise for the sake of praise.
- Do not invent issues.
- If no meaningful issues are found, say so clearly and mention residual risk areas instead.
- Prefer comments that a developer can act on immediately.

## Special checks for Next.js projects

- Check whether server-only code leaked into client components.
- Check whether route handlers validate params, query, and body.
- Check status codes and response shape consistency.
- Check caching and runtime choices when they affect behavior.
- Check loading, error, and empty states for UI changes.
- Check whether new features changed contracts without corresponding tests or docs.

## Special checks for tests

- Confirm tests assert behavior rather than implementation details.
- Flag over-mocking, missing unhappy-path coverage, and brittle selectors.
- Ensure critical user flows or endpoint contracts have proportional coverage.
