# scryai

Canonical home-base repository for **scry** and Stephen (`dunamismax`): identity, operating contracts, workstation bootstrap, and cross-repo orchestration.

This repo is intentionally **not** an app monorepo. Product apps live in dedicated sibling repositories under `~/github`.

## What Lives Here

- Identity + operations contracts: `SOUL.md`, `AGENTS.md`
- Root orchestration scripts: `scripts/`
- Shared local infrastructure: `infra/` (PostgreSQL + MinIO + Caddy)
- Durable operational docs: `docs/`
- Encrypted SSH continuity artifacts: `vault/ssh/`

## Managed Project Repositories

| Project | Local path | Primary purpose |
|---|---|---|
| `astro-web-template` | `~/github/astro-web-template` | Full-stack Astro website template baseline |
| `astro-blog-template` | `~/github/astro-blog-template` | Astro-based blog template |

The orchestrator tracks these projects via `scripts/projects-config.ts`.

## Prerequisites

- `bun`
- `docker` + `docker compose`
- `git`
- `ssh`
- `curl`
- `tar`
- `openssl`
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
- repositories from `~/github/dunamismax/REPOS.md` are cloned/fetched
- dual `origin` push URLs are enforced (GitHub + Codeberg)

## Root Commands

```bash
# setup / health
bun run bootstrap
bun run setup:workstation
bun run setup:ssh:backup
bun run setup:ssh:restore
bun run setup:minio
bun run setup:zig
bun run doctor
bun run check:agent-docs

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
bun run ci

# optional cross-repo lighthouse (defaults to ~/github/astro-web-template)
bun run perf:lighthouse
bun run perf:lighthouse:assert -- --report artifacts/lighthouse/current.json
```

## CI/CD Scope (This Repo)

`/home/sawyer/github/scryai` CI validates root orchestration/docs/scripts only.

Product app CI runs in their own repositories:
- `~/github/astro-web-template`
- `~/github/astro-blog-template`

## Repository Layout

| Path | Purpose |
|---|---|
| `scripts/` | Orchestration, setup, and verification scripts. |
| `scripts/projects-config.ts` | Managed project inventory and command policy. |
| `infra/` | Self-hostable local infrastructure manifests. |
| `docs/` | Durable operations/performance docs. |
| `vault/ssh/` | Encrypted SSH continuity artifacts. |
| `SOUL.md` | Identity source of truth for scry. |
| `AGENTS.md` | Operational source of truth for scry. |

## Documentation Links

- Runtime operations: [`AGENTS.md`](AGENTS.md)
- Identity and voice: [`SOUL.md`](SOUL.md)
- Performance tooling docs: [`docs/performance/README.md`](docs/performance/README.md)
- SSH continuity docs: [`vault/ssh/README.md`](vault/ssh/README.md)

## License

[MIT](LICENSE)
