# scry

This is the meta-repo for Stephen and **scry**: identity, standards, infrastructure, and monorepo apps.

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
| `CLAUDE.md` | Runtime operating rules (canonical source). |
| `AGENTS.md` | Exact mirror of `CLAUDE.md` for multi-agent compatibility. |

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

## License

[MIT](LICENSE)
