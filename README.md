# scryai

Canonical root repository for **scry** and Stephen (`dunamismax`): standards, infrastructure, and full-stack apps.

This README is the entrypoint for the entire repo. It tells you how to run shared infrastructure and where each project lives.

## What Lives Here

- Shared operating docs and identity: `SOUL.md`, `AGENTS.md`
- Shared local infrastructure: PostgreSQL + MinIO + Caddy in `infra/`
- Monorepo apps in `apps/`
- Root automation scripts in `scripts/`

## Current Projects

| Project | Type | Path | Docs |
|---|---|---|---|
| bedrock-web | Full-stack website template | `apps/bedrock-web` | [`apps/bedrock-web/README.md`](apps/bedrock-web/README.md) |

App index: [`apps/README.md`](apps/README.md)

## Stack Baseline

All projects in this repo are expected to follow this baseline unless explicitly changed:

- Framework: Qwik + Qwik City
- Runtime: Bun (`Bun.serve` for production servers)
- Build: Vite
- UI: Qwik + Tailwind CSS v4 + Qwik-native component primitives
- Language: TypeScript
- Lint/format: Biome
- Database: PostgreSQL (`pgvector`, `pgcrypto`)
- DB access: `postgres.js` (SQL-first)
- Auth: Better Auth
- Jobs: pg-boss
- Object storage: MinIO
- Reverse proxy: Caddy

## Repository Layout

| Path | Purpose |
|---|---|
| `apps/` | Product applications (`apps/<name>`). |
| `infra/` | Shared local infrastructure (docker compose + Caddy). |
| `scripts/` | Root TypeScript orchestration scripts. |
| `SOUL.md` | Identity contract for scry. |
| `AGENTS.md` | Runtime operational contract for this repo. |

## Prerequisites

- `bun`
- `docker` + `docker compose`
- `git`
- `curl`
- `tar`
- `zig` (bootstrap can install/configure this path)

## Quick Start (Repo + App)

1. Install dependencies and initialize local defaults

```bash
bun install
bun run bootstrap
```

2. Start shared infrastructure

```bash
bun run infra:up
```

3. Open app and follow its setup

```bash
cd apps/bedrock-web
cp .env.example .env
bun run db:migrate
bun run dev
```

For app-specific details, always use that app's README:
[`apps/bedrock-web/README.md`](apps/bedrock-web/README.md)

## Root Commands

These run from repo root:

```bash
# Setup / health
bun run bootstrap
bun run setup:minio
bun run setup:zig
bun run doctor
bun run check:agent-docs

# Infra
bun run infra:up
bun run infra:down
bun run infra:logs

# Root quality gates (scripts + root config)
bun run lint
bun run format
bun run typecheck
bun run test
```

## App Commands

Run these from inside an app directory (example: `apps/bedrock-web`):

```bash
bun run dev
bun run build
bun run start
bun run typecheck
bun run lint
bun run format
bun run test
bun run db:migrate
bun run db:seed
bun run worker
```

Note: `apps/bedrock-web` currently still reflects the previous React Router template baseline and will be migrated to Qwik in a separate app rewrite phase.

## Infra Defaults

Defaults come from `infra/.env.example`:

- PostgreSQL: `15432`
- MinIO API: `19000`
- MinIO Console: `19001`
- Caddy HTTP: `18080`
- Caddy HTTPS: `18443`

Compose services are defined in [`infra/docker-compose.yml`](infra/docker-compose.yml).
Caddy baseline config is in [`infra/Caddyfile`](infra/Caddyfile).

## Documentation Links

- Operational contract: [`AGENTS.md`](AGENTS.md)
- Identity contract: [`SOUL.md`](SOUL.md)
- Qwik migration plan: [`docs/qwik-cutover-plan.md`](docs/qwik-cutover-plan.md)
- Apps index: [`apps/README.md`](apps/README.md)
- bedrock-web docs: [`apps/bedrock-web/README.md`](apps/bedrock-web/README.md)

## Troubleshooting

- `ECONNREFUSED ...15432`: infra database is not running. Run `bun run infra:up`.
- `EADDRINUSE ...3000`: port in use. Set a different app `PORT` in app `.env`.
- Missing infra env file: run `bun run setup:minio` (or `bun run bootstrap`).

## License

[MIT](LICENSE)
