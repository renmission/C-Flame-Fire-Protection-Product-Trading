---
description: Investigate and fix a bug or issue from a ticket number or natural-language description
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Fix Issue Command

Investigate and fix the requested issue in this repository.

## Arguments

`$ARGUMENTS`

Interpret `$ARGUMENTS` as either:

- An issue number, for example `123`
- A ticket reference, for example `PROJ-123`
- A short bug description, for example `save button spins forever on mobile`

If the issue description is ambiguous, start by restating the likely interpretation and proceed using repository context.

## Primary objective

Make the smallest correct change that fixes the root cause without creating unrelated churn.

## Workflow

1. Read `.claude/rules/testing.md` and `.claude/rules/api-conventions.md` if they are relevant to the issue.
2. Search the codebase for the affected feature, route, component, error message, ticket reference, or domain term.
3. Understand the current behavior before editing anything.
4. Identify the root cause, not just the visible symptom.
5. Implement the minimum coherent fix.
6. Add or update tests when the affected behavior is testable.
7. Review the local diff for accidental side effects.

## Fix strategy

- Prefer existing patterns already used in the repository.
- Keep route handlers thin and place logic in reusable modules when needed.
- Preserve public API contracts unless the issue explicitly requires a contract change.
- Avoid broad refactors unless they are necessary to make the fix safe.
- If the issue cannot be fixed safely without a wider change, say so clearly and explain the smallest safe scope.

## Required checks

Always check these when relevant:

- Input validation and error handling.
- Loading, empty, and error states.
- Auth, authorization, and tenant boundaries.
- Race conditions, stale state, and duplicate submissions.
- Status codes, response shape, and client/server assumptions.
- Regression risk in nearby code paths.

## Output format

Return these sections in order:

### Understanding

Briefly state what issue you believe you are fixing.

### Root cause

Explain the actual cause in concrete code terms.

### Changes made

List the files changed and the purpose of each change.

### Tests

Describe tests added, updated, or still needed.

### Risks

List any remaining uncertainty or follow-up work.

## Guardrails

- Do not make speculative fixes without code evidence.
- Do not rewrite unrelated files.
- Do not silently skip tests if behavior changed; explain why no test was added if that happens.
- If the issue references an external tracker but the repo lacks issue details, infer from local context and state the assumption clearly.
- If multiple plausible root causes exist, choose the one best supported by the code and mention the alternatives briefly.

## Next.js-specific guidance

- For Route Handler bugs, verify method exports, request parsing, validation, and response codes.
- For App Router UI bugs, check Server vs Client component boundaries and data-fetch placement.
- For form or mutation bugs, inspect server actions, optimistic state, and duplicate-submit protection.
- For caching bugs, inspect `fetch` cache behavior, route config, and revalidation choices.
