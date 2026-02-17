# bedrock-template

Production-ready Qwik City starter for the scry stack:

- Qwik + Qwik City
- Bun runtime with Qwik City Bun adapter (`Bun.serve`)
- Tailwind CSS v4
- Self-hosted fonts via Fontsource (Space Grotesk Variable + IBM Plex Sans)
- Better Auth
- PostgreSQL (`postgres.js`) + plain SQL migrations
- MinIO object storage
- pg-boss background jobs

## Features

- Email/password auth with Better Auth mounted at `/api/auth/*`
- Protected routes and RBAC (`member`, `manager`, `admin`)
- Admin user management (role + account activation)
- Security defaults: CSP, strict headers, same-origin mutation checks
- Route-level `cacheControl` headers (public caching on landing, no-cache on auth pages)
- Auth form rate limiting with Zod schema validation
- MinIO upload flow with asset metadata table
- pg-boss worker scaffold and queue publishing example
- SQL-first data access with `postgres.js`
- Self-hosted fonts — zero external CDN requests for font loading
- Server build minification enabled for production

## Quick Start

1. Install dependencies

```bash
bun install
```

2. Copy env file

```bash
cp .env.example .env
```

3. Start infra from repo root (if not already running)

```bash
bun run infra:up
```

4. Apply DB migrations

```bash
bun run db:migrate
```

5. Start app

```bash
bun run dev
```

6. Optional: promote a user to admin

```bash
BOOTSTRAP_ADMIN_EMAIL=you@example.com bun run db:seed
```

## Scripts

```bash
bun run dev
bun run build
bun run serve
bun run typecheck
bun run lint
bun run format
bun run test
bun run db:migrate
bun run db:seed
bun run worker
```

## Project Layout

- `src/routes/` Qwik City pages and API routes
- `src/lib/` auth, db, security, jobs, storage, RBAC
- `db/migrations/` plain SQL migrations
- `scripts/` migration runner, seed, worker
- `src/entry.bun.ts` Bun production server entry

## Notes

- Better Auth user table is extended with `role` and `isActive`.
- `ENABLE_JOBS=true` is required for live pg-boss queueing and worker processing.
- Uploads are persisted to MinIO and indexed in the `asset` table.
- Fonts are self-hosted via `@fontsource-variable/space-grotesk` and `@fontsource/ibm-plex-sans` (latin subset). No Google Fonts CDN dependency.
- Static assets are served with `immutable` cache headers via the Bun adapter. Route responses use Qwik City's `cacheControl` API.
