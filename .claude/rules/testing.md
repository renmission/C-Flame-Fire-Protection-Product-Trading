# Next.js Testing Rules

## Scope

These rules apply to tests in this repository, with priority on modern Next.js App Router projects.

## Testing stack

- Default test runner: Vitest for unit and component tests.
- Default component testing utility: React Testing Library.
- Default E2E framework: Playwright.
- Use Jest only if the repository already depends on it or a package requires Jest-specific APIs.

## Required test pyramid

- Write unit tests for pure functions, schema validation, formatters, mappers, and server-side utilities.
- Write component tests for interactive client components, loading states, error states, and accessibility-sensitive UI.
- Write integration tests for boundaries that combine routing, forms, auth/session checks, data fetching, or server actions.
- Write E2E tests for critical business flows only, such as login, onboarding, checkout, CRUD happy path, and permission boundaries.

## App Router guidance

- Prefer testing behavior, not framework internals.
- Treat Server Components as integration targets more than isolated unit targets.
- Keep business logic out of route files, page files, and server actions when possible; extract it into testable modules.
- For Route Handlers under `app/**/route.ts`, test the handler response shape, status, headers, and invalid-input behavior.
- When dynamic route params are used in Route Handlers, model them as async params in tests because `context.params` resolves from a promise in current Next.js Route Handlers.

## API and server tests

- Test each supported HTTP method explicitly.
- Assert status code, structured body, and key headers for every endpoint test.
- Cover success, validation failure, unauthorized/forbidden, not found, conflict, rate-limit, and unexpected-error paths when they exist.
- Do not mock `fetch` if the code under test is a pure transformer; only mock network boundaries.
- If request parsing uses `request.json()` or `request.formData()`, include malformed payload tests.
- For webhook endpoints, verify raw-body handling and signature validation behavior.

## Component tests

- Use queries that reflect user intent: `getByRole`, `getByLabelText`, `getByText` before test IDs.
- Prefer `userEvent` over low-level event dispatching.
- Test visible outcomes, ARIA state, and callback effects rather than internal state variables.
- Every interactive component should have at least one keyboard-access test if keyboard behavior matters.
- Add tests for loading, empty, error, and disabled states when the component supports them.

## E2E rules

- Keep E2E coverage thin but high-value.
- Seed or mock data deterministically so tests are repeatable.
- Avoid brittle selectors; prefer roles, labels, and stable data attributes reserved for test automation.
- Verify redirects, auth guards, and form submissions in a production-like flow.
- Do not duplicate broad UI coverage already handled by component tests.

## Mocking policy

- Mock at system boundaries: external APIs, email providers, payment gateways, storage, and time.
- Do not mock your own domain logic unless isolation is the point of the test.
- Prefer MSW for HTTP mocking in browser-like tests.
- Keep fixture data small, explicit, and local to the test unless reused widely.

## Quality bar

- New features should ship with tests proportional to risk.
- Bug fixes should include a regression test when practical.
- Flaky tests must be fixed or removed quickly; do not normalize retries as the main solution.
- Snapshot tests are allowed only for stable, intentionally reviewed output; do not use snapshots as a substitute for assertions.

## Recommended structure

- Co-locate fast unit tests with the source when the repo already follows that pattern, or use a dedicated `tests/` tree consistently.
- Name tests after behavior, for example: `returns_400_for_invalid_payload` or `shows_error_when_save_fails`.
- Separate unit, integration, and E2E concerns clearly in file names or directories.

## Minimum pull request expectations

- Add or update tests for changed behavior.
- Run the fastest relevant subset locally first, then broader suites before merge.
- Do not merge code that changes endpoint contracts or user-critical flows without test coverage.
