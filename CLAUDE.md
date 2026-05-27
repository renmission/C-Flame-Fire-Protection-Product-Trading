# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Internal management platform for C'FLAME Fire Protection Product Trading.
Modules: inventory, payroll/HR, deliveries, POS, customers, attendance, users/RBAC, reports.
Version 0.1.0 — actively developed.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack in dev)
- **Language**: TypeScript 5 (strict mode, `@/*` path alias)
- **Styling**: Tailwind CSS 3.4 + shadcn/ui (Radix UI primitives)
- **State**: Zustand 5 (UI state), TanStack Query 5 (server state)
- **Database**: PostgreSQL (Neon serverless) + Drizzle ORM 0.38
- **Auth**: NextAuth.js v5 — JWT strategy, credentials provider
- **Validation**: Zod — schemas are source of truth for TypeScript types
- **Forms**: react-hook-form + `@hookform/resolvers/zod`
- **PDF**: pdf-lib | **Charts**: Recharts | **Icons**: Lucide React
- **Package manager**: pnpm 9

## Key Directories

| Path                      | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `app/(auth)/`             | Login/auth routes (unprotected)                               |
| `app/dashboard/`          | Protected dashboard pages — one sub-folder per module         |
| `app/api/`                | 70+ REST API routes organized by resource                     |
| `components/ui/`          | shadcn/ui primitives (button, card, table, input…)            |
| `components/dashboard/`   | Dashboard shell, sidebar, nav, role-specific dashboards       |
| `components/{module}/`    | Feature components: inventory, payroll, pos, users, delivery… |
| `lib/db/schema.ts`        | Drizzle ORM schema — single source of truth for all tables    |
| `lib/db/index.ts`         | DB client + re-exports all schema symbols (`import { db, users, ... } from "@/lib/db"`) |
| `lib/auth.ts`             | NextAuth config + JWT callbacks (roles baked into JWT at sign-in) |
| `lib/api-auth.ts`         | `getSessionOr401()` + `requirePermission()` — used at top of every API route |
| `lib/auth/permissions.ts` | RBAC: `PERMISSIONS`, `ROLES`, `ROLE_PERMISSIONS`, `can()`, nav config |
| `lib/{module}-api.ts`     | Client-side `fetch` wrappers — call these from components/hooks |
| `lib/{module}.ts`         | Server-side domain logic shared across API routes (e.g. `applyStockMovement`) |
| `lib/errors.ts`           | `AppError`, `apiErrorResponse()`, `withRouteErrorHandling()`, `parseApiResponse()` |
| `schemas/`                | Zod schemas — one file per module, types inferred with `z.infer<>` |
| `stores/ui-store.ts`      | Zustand UI store (sidebar, modals, filters)                   |
| `types/next-auth.d.ts`    | NextAuth session/JWT type extensions                          |
| `middleware.ts`           | Route protection + auth redirects (dashboard requires auth)   |
| `drizzle/`                | ORM migration files                                           |
| `scripts/`                | DB seeding and backfill scripts (run with `tsx`)              |

## Essential Commands

```bash
# Development
pnpm dev              # Next.js + Turbopack

# Quality gates (pre-commit runs these in order)
pnpm typecheck        # tsc --noEmit
pnpm lint             # ESLint
pnpm format:check     # Prettier dry-run
pnpm format           # Prettier write (fix formatting)

# Production
pnpm build
pnpm start

# Database
pnpm db:generate      # Generate migration from schema changes
pnpm db:migrate       # Apply pending migrations
pnpm db:push          # Push schema directly (prototyping only)
pnpm db:studio        # Drizzle Studio visual DB browser
pnpm db:seed          # Seed roles + admin user
```

Pre-commit hook order: Prettier (staged) → typecheck → lint → build.

## Environment Variables

Required in `.env.local`: `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN` (Vercel Blob — required for product image uploads).
Seed script also requires: `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## RBAC

Six roles: `admin`, `inventory_manager`, `payroll_manager`, `delivery_staff`, `pos_cashier`, `viewer`.
`ROLE_PERMISSIONS` in `lib/auth/permissions.ts` maps each role to its permission set.
`can(user, permission)` is the single check used in middleware, API routes, and UI.
`payroll_manager` doubles as the HR role — has `USERS_READ` + `USERS_WRITE`.

## Architectural Patterns

### API Route Handler Pattern

Every route handler in `app/api/**/route.ts` follows this sequence:

```ts
export async function GET(req: NextRequest) {
  // 1. Authenticate
  const { user, response } = await getSessionOr401();
  if (response) return response;

  // 2. Authorize
  const forbidden = requirePermission(user, PERMISSIONS.SOME_PERMISSION);
  if (forbidden) return forbidden;

  // 3. Validate input (query params, body)
  const parsed = someSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));

  // 4. Query DB with Drizzle
  const rows = await db.select().from(someTable).where(...);

  // 5. Return JSON response
  return Response.json({ data: rows });
}
```

Wrap the whole handler in `withRouteErrorHandling()` if unhandled exceptions should return a 500 instead of crashing.

### Client API Wrapper Pattern

`lib/{module}-api.ts` exposes typed `async` functions that `fetch` the API routes. Always use `parseApiResponse<T>(res, fallbackMessage)` from `lib/errors.ts` — it throws `AppError` on non-2xx, which is safe to display in the UI.

```ts
export async function fetchProducts(query: Partial<ProductsListQuery>) {
  const res = await fetch(`/api/inventory/products${buildQueryString(query)}`);
  return parseApiResponse<ProductsListResponse>(res, "Failed to load products");
}
```

### Shared Domain Logic

`lib/{module}.ts` (no `-api` suffix) holds server-only business logic reused across multiple API routes. For example, `lib/inventory.ts` exports `applyStockMovement()` which is called by both the inventory movements route and the POS route. Keep this layer free of HTTP concerns.

### Form Pattern

Forms use `react-hook-form` with a Zod resolver. The Zod schema in `schemas/{module}.ts` is the source of truth; the TypeScript type is inferred from it.

```ts
const form = useForm<ProductFormValues>({
  resolver: zodResolver(productSchema),
});
```

### TanStack Query

Server state (lists, details) is fetched via TanStack Query with keys like `["products", queryParams]`. Mutations call the client API wrapper, then `queryClient.invalidateQueries(...)`.

### Error Response Shape

All API errors follow `{ error: string, code?: string }`. Success responses use `{ data: ... }` (collections also include `total`, `page`, `limit`).

## Feature Development or Fixing Bugs

**IMPORTANT:** When you work on a new feature or bug, create a git branch first. Then work on changes in that branch for the remainder of the session. Do not switch branches mid-session.
