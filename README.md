# scryai

Canonical home-base repository for **scry** and Stephen (`dunamismax`): identity, operating contracts, workstation bootstrap, and cross-repo orchestration.

This repo is intentionally **not** an app monorepo. Product apps live in dedicated sibling repositories under `~/github`.

## What Lives Here

- Identity + operations contracts: `SOUL.md`, `AGENTS.md`
- Root orchestration scripts: `scripts/`
- Shared local infrastructure: `infra/` (PostgreSQL + Garage S3-compatible object storage)
- Durable operational docs: `docs/`
- Encrypted SSH continuity artifacts: `vault/ssh/`

## Managed Project Repositories

| Project | Local path | Primary purpose |
|---|---|---|
| `next-web-template` | `~/github/next-web-template` | Full-stack Next.js 15 App Router template baseline |
| `next-blog-template` | `~/github/next-blog-template` | Next.js 15 blog template baseline |

The orchestrator tracks these projects via `scripts/projects-config.ts`.

## Managed Stack Baseline

The application stack baseline for managed projects is:

- Next.js 15 (App Router)
- Languages: TypeScript + Zig
- PostgreSQL (Dockerized) + Drizzle ORM + Drizzle Kit migrations
- Better-Auth + Zod
- Tailwind CSS + shadcn/ui
- Garage (S3-compatible object storage)
- Coolify for self-hosted push-to-deploy operations

## Prerequisites

- `bun`
- `docker` + `docker compose`
- `git`
- `ssh`
- `curl`
- `tar`
- `zig` (bootstrap can install/configure this path)

## Quick Start

Run from `~/github/scryai`:

```bash
bun install
bun run setup:workstation
bun run bootstrap
bun run projects:doctor
```

Optional full validation across managed projects:

```bash
bun run projects:verify
```

## New Machine Bootstrap

```bash
mkdir -p ~/github
cd ~/github
git clone git@github.com:dunamismax/scryai.git
cd scryai
bun install

# optional if encrypted SSH backup exists
export SCRY_SSH_BACKUP_PASSPHRASE='use-a-long-unique-passphrase'
bun run setup:ssh:restore

bun run setup:workstation
bun run bootstrap
```

`setup:workstation` guarantees:
- `~/github/scryai` bootstrap anchor is present first
- `~/github/dunamismax` profile repo is present second
- repositories parsed from `~/github/dunamismax/REPOS.md` are cloned/fetched
- if parsing yields zero repos, the command fails fast by default
- `--use-fallback` enables fallback discovery-only mode (no fallback remote mutations)
- dual `origin` push URLs are enforced (GitHub + Codeberg)

## Root Commands

```bash
# setup / health
bun run bootstrap
bun run setup:workstation
bun run setup:ssh:backup
bun run setup:ssh:restore
bun run setup:storage
bun run setup:zig
bun run doctor

# managed projects
bun run projects:list
bun run projects:doctor
bun run projects:install
bun run projects:verify

# infra
bun run infra:up
bun run infra:down
bun run infra:logs

# root quality gates
bun run lint
bun run format
bun run typecheck
bun run test
bun run ci:root
bun run ci:projects
bun run ci
```

## CI/CD Scope (This Repo)

`/home/sawyer/github/scryai` CI validates root orchestration/docs/scripts only.

Product app CI runs in their own repositories:
- `~/github/next-web-template`
- `~/github/next-blog-template`

Performance and Lighthouse quality gates are owned by each product repo (not `scryai`):
- `~/github/next-web-template/docs/performance/README.md`
- `~/github/next-blog-template/docs/performance/README.md`

## Repository Layout

| Path | Purpose |
|---|---|
| `scripts/` | Orchestration, setup, and verification scripts. |
| `scripts/projects-config.ts` | Managed project inventory and command policy. |
| `infra/` | Self-hostable local infrastructure manifests. |
| `docs/` | Durable operations docs. |
| `vault/ssh/` | Encrypted SSH continuity artifacts. |
| `SOUL.md` | Identity source of truth for scry. |
| `AGENTS.md` | Operational source of truth for scry. |

## Documentation Links

- Runtime operations: [`AGENTS.md`](AGENTS.md)
- Identity and voice: [`SOUL.md`](SOUL.md)
- Local docs ownership: [`docs/README.md`](docs/README.md)
- SSH continuity docs: [`vault/ssh/README.md`](vault/ssh/README.md)

## License

[MIT](LICENSE)
