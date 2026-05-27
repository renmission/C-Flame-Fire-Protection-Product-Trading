# C'FLAME

Internal management platform for **C'FLAME Fire Protection Product Trading** — inventory, sales, and delivery tracking.

## Setup

This project uses **pnpm**.

### Environment

Create `.env.local` (or use `.env`) with:

- `DATABASE_URL` — Neon (or other Postgres) connection string
- `AUTH_SECRET` — secret for NextAuth sessions (e.g. `openssl rand -base64 32`)

Optional for seed script (`pnpm db:seed`):

- `ADMIN_EMAIL` — default `admin@cflame.local`
- `ADMIN_PASSWORD` — default `admin123`

### Commands

```bash
# Install dependencies
pnpm install

# Push DB schema (after DATABASE_URL is set)
pnpm db:push

# Seed roles and admin user
pnpm db:seed

# Development
pnpm dev

# Build
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Type check
pnpm typecheck

# Format (Prettier)
pnpm format
```

### Pre-commit (Husky)

On `git commit`, the pre-commit hook runs in order: **Prettier** (staged files) → **TypeScript** (`tsc --noEmit`) → **ESLint** → **Build**. Install deps with `pnpm install` so Husky is set up. Skip with `git commit -n` or `HUSKY=0 git commit`.

## Tech stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Shadcn UI, Neon (PostgreSQL), Drizzle ORM
- NextAuth.js, RBAC

See `docs/` for project plan and phase status (docs are gitignored).
