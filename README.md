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
| bedrock-template | Full-stack website template | `apps/bedrock-template` | [`apps/bedrock-template/README.md`](apps/bedrock-template/README.md) |

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
- `ssh`
- `curl`
- `tar`
- `openssl`
- `zig` (bootstrap can install/configure this path)

## Quick Start (Repo + App)

Run from the `scryai` repo root (`~/github/scryai`).

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
cd apps/bedrock-template
cp .env.example .env
bun run db:migrate
bun run dev
```

For app-specific details, always use that app's README:
[`apps/bedrock-template/README.md`](apps/bedrock-template/README.md)

## New System Bootstrap

Use this flow when provisioning a fresh machine from `scryai`:

1. Start rule: be inside `scryai` first

If you are **not already inside** the `scryai` repo:

```bash
mkdir -p ~/github
cd ~/github
git clone git@github.com:dunamismax/scryai.git
cd scryai
bun install
```

If you are **already inside** `scryai` (for example you cloned it manually and launched Codex there), keep going from that working directory.

2. Restore encrypted SSH backup (if available)

```bash
export SCRY_SSH_BACKUP_PASSPHRASE='use-a-long-unique-passphrase'
bun run setup:ssh:restore
```

3. Bootstrap all repos in order (`scryai` anchor first, then `dunamismax`, then the rest from `REPOS.md`)

```bash
bun run setup:workstation
```

`setup:workstation` guarantees this order:
- Ensure `~/github/scryai` exists first (anchor repo).
- Clone/fetch `~/github/dunamismax` second.
- Read `~/github/dunamismax/REPOS.md`.
- Clone/fetch all listed repos and enforce dual SSH push URLs.

4. Finish local tooling + infra setup

```bash
bun run bootstrap
```

5. Validate Git and SSH posture

```bash
ssh -T git@github.com
ssh -T git@codeberg.org
git -C ~/github/scryai remote get-url --all --push origin
```

SSH backup vault docs: [`vault/ssh/README.md`](vault/ssh/README.md)

## Root Commands

These run from repo root:

```bash
# Setup / health
bun run bootstrap
bun run setup:workstation
bun run setup:ssh:backup
bun run setup:ssh:restore
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

Run these from inside an app directory (example: `apps/bedrock-template`):

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
- Apps index: [`apps/README.md`](apps/README.md)
- bedrock-template docs: [`apps/bedrock-template/README.md`](apps/bedrock-template/README.md)

## Troubleshooting

- `ECONNREFUSED ...15432`: infra database is not running. Run `bun run infra:up`.
- `EADDRINUSE ...3000`: port in use. Set a different app `PORT` in app `.env`.
- Missing infra env file: run `bun run setup:minio` (or `bun run bootstrap`).

## License

[MIT](LICENSE)
