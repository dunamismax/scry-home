# scryai

This is the meta-repo for Stephen and **scry**: identity, standards, infrastructure, and monorepo apps.

Canonical repository URL: <https://github.com/dunamismax/scryai>

## Core Stack (Mandatory)

- App framework: **React Router 7** (Data Mode)
- Server adapter/runtime: **Bun** (`Bun.serve`)
- Build tool: **Vite**
- UI: **React** + **Tailwind CSS v4** + **shadcn/ui**
- Language: **TypeScript**
- Lint/format: **Biome**
- Database: **PostgreSQL** (`pgvector`, `pgcrypto`)
- DB access: **postgres.js** (SQL-first)
- Migrations: **plain SQL**
- Auth: **Better Auth**
- Background jobs: **pg-boss**
- Object storage: **MinIO** (S3-compatible)
- Reverse proxy: **Caddy**

Everything must be self-hostable.

## Monorepo Layout

| Path | Purpose |
|---|---|
| `apps/` | All product apps (`apps/<name>`). |
| `apps/scrybase/` | Current application. |
| `scripts/` | TypeScript orchestration scripts run through `bun run`. |
| `infra/` | Self-host stack for PostgreSQL, MinIO, and Caddy. |
| `SOUL.md` | Partnership constitution and long-term memory. |
| `AGENTS.md` | Runtime operating rules (single source of truth). |

## Quick Start

```bash
bun install
bun run bootstrap
bun run infra:up
bun run app:scrybase:dev
```

## Useful Commands

```bash
# Infra
bun run setup:minio
bun run setup:zig
bun run infra:up
bun run infra:down
bun run infra:logs

# App
bun run app:scrybase:dev
bun run app:scrybase:build
bun run app:scrybase:typecheck
bun run app:scrybase:migrate
bun run app:scrybase:worker

# Tooling
bun run lint
bun run format
bun run typecheck
bun run doctor
bun run check:agent-docs
```

## Infra Defaults

Infra definitions live in `infra/`:

- PostgreSQL (`pgvector` image)
- MinIO (S3-compatible object storage)
- Caddy (reverse proxy)

Default local ports are defined in `infra/.env.example`:

- PostgreSQL: `15432`
- MinIO API: `19000`
- MinIO Console: `19001`
- Caddy HTTP: `18080`
- Caddy HTTPS: `18443`

## License

[MIT](LICENSE)
