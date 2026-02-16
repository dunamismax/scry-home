# scrybase

Scrybase is built with the locked stack:

- React Router 7 (SSR data APIs)
- Bun runtime and Bun.serve adapter (`server.ts`)
- Vite + Tailwind CSS v4 + shadcn/ui patterns
- PostgreSQL (`pgvector`, `pgcrypto`) via `postgres.js` SQL template literals
- Better Auth
- MinIO (`@aws-sdk/client-s3`)
- pg-boss
- Biome

## Commands

```bash
bun run dev
bun run build
bun run start

bun run db:migrate
bun run jobs:worker

bun run lint
bun run format
bun run typecheck
bun run test
```

## Database Migrations

Migrations are plain SQL files in `migrations/` and are applied by `scripts/migrate.ts`.

## Local Stack

`docker-compose.yml` provides local Postgres, MinIO, app, worker, and Caddy.
