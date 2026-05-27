# Coding Rules

## TypeScript

- Strict mode. No `any` — use `unknown` and narrow, or define a proper type.
- Use `interface` for object shapes, `type` for unions/intersections.

## Next.js

- React Server Components by default. Add `"use client"` only for interactivity or browser APIs.
- Fetch data in Server Components directly from the DB when possible.

## Styling

- Use `cn` (clsx + tailwind-merge) for all conditional class names. Never concatenate class strings manually.
- Shadcn component customizations go in `shared/components/ui/` — do not modify the raw generated files in-place.

## Naming Conventions

| Target                | Convention                 | Example                              |
| --------------------- | -------------------------- | ------------------------------------ |
| Files & folders       | `kebab-case`               | `user-profile.tsx`                   |
| Components & types    | `PascalCase`               | `UserProfile`                        |
| Variables & functions | `camelCase`                | `formatDate`                         |
| Hooks                 | `camelCase` + `use` prefix | `useAuth`                            |
| Constants & env vars  | `UPPER_SNAKE_CASE`         | `API_URL`                            |
| Next.js routing files | reserved names             | `page.tsx`, `layout.tsx`, `route.ts` |
