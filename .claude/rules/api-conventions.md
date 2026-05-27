# Next.js API Conventions

## Scope

These conventions apply to server endpoints in this repository, especially Next.js App Router Route Handlers.

## Default API style

- Prefer App Router Route Handlers in `app/api/**/route.ts` for HTTP endpoints.
- Use `pages/api/**` only in legacy areas that have not been migrated.
- Use Server Actions for form-oriented mutations that do not need a public HTTP contract; use Route Handlers when the endpoint is consumed externally, needs webhook compatibility, or should expose a stable API boundary.

## File and routing conventions

- One resource path per folder, with HTTP methods exported from the same `route.ts` file.
- Use nested folders for resource identity and hierarchy, for example `app/api/users/[id]/route.ts`.
- Keep route files thin; move validation, authorization, business rules, and data access into reusable modules.
- When using dynamic segments, treat `params` as async in Route Handlers.

## Handler conventions

- Export named functions for each HTTP method used: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.
- Return Web `Response` objects or `Response.json(...)` consistently.
- Parse query params from `request.nextUrl.searchParams`.
- Use `NextRequest` only when you need Next-specific helpers like `nextUrl` or cookie helpers; otherwise plain `Request` is fine.
- Keep handlers side-effect aware and idempotent where the HTTP method expects it.

## Request validation

- Validate all untrusted input at the edge of the handler.
- Prefer schema validation such as Zod for body, params, and query parsing.
- Reject unknown or malformed input with clear client-safe error messages.
- Never trust `FormData` types without parsing and coercion.

## Response shape

- Keep success responses consistent across the project.
- Prefer one of these patterns and stick to it per API surface:
  - Resource response: `{ data: ... }`
  - Mutation response: `{ data: ..., meta?: ... }`
  - Error response: `{ error: { code, message, details? } }`
- Include machine-readable error `code` values.
- Do not leak stack traces, raw database errors, or provider secrets in responses.

## Status code rules

- `200` for successful reads and general successful actions.
- `201` for successful creation.
- `202` for accepted async work.
- `204` for success with no body.
- `400` for malformed input.
- `401` for unauthenticated requests.
- `403` for authenticated but unauthorized requests.
- `404` when the resource does not exist.
- `409` for conflicts or uniqueness violations.
- `422` for semantically invalid input if the project distinguishes it from `400`.
- `429` for rate limiting.
- `500` only for unexpected server failures.

## Headers and cookies

- Set headers intentionally, especially `Content-Type`, caching, and security-related headers.
- Use `cookies()` from `next/headers` or `request.cookies` consistently; avoid mixing styles unnecessarily in the same codebase.
- If CORS is needed, define explicit origins, methods, and headers where possible instead of wildcard defaults.
- If an endpoint supports multiple methods and custom preflight behavior, implement `OPTIONS` explicitly.

## Caching and runtime

- Be explicit about caching behavior for `GET` handlers.
- Use route segment config intentionally, including `revalidate`, `runtime`, `preferredRegion`, and related settings.
- Choose `runtime = 'nodejs'` by default unless Edge provides a clear benefit and all dependencies are Edge-compatible.
- Document non-default caching or runtime choices in code comments when the reason is not obvious.

## Authentication and authorization

- Authenticate early in the handler.
- Authorize per resource and action, not just per route group.
- Return `401` when identity is missing and `403` when identity exists but lacks permission.
- Never rely on client-provided role or tenant values without server verification.

## Error handling

- Normalize thrown errors into safe HTTP responses.
- Log server-side details with enough context for debugging, but keep client responses minimal and consistent.
- Prefer typed domain errors mapped to stable HTTP status codes.
- For unexpected failures, return a generic message and preserve details only in server logs.

## Webhooks and external consumers

- For webhooks, read the raw body when signature verification requires it.
- Verify signatures before parsing or processing when the provider requires raw payload integrity.
- Make webhook processing idempotent when repeated delivery is possible.
- Acknowledge quickly and offload long-running work when possible.

## Versioning and compatibility

- Avoid breaking response contracts casually.
- If public clients depend on the API, use versioning or additive changes first.
- Deprecate fields in stages; do not silently change types or meanings.

## Documentation expectations

- Every non-trivial endpoint should make clear its method, input, auth requirement, and response contract.
- Keep examples aligned with actual code.
- Update docs and tests when contracts change.

## Preferred implementation pattern

1. Parse request context.
2. Authenticate and authorize.
3. Validate params, query, and body.
4. Call domain/service layer.
5. Map result to a stable HTTP response.
6. Add headers and caching directives intentionally.
7. Handle and normalize failures.
