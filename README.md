# scryai

Canonical home-base repository for **scry** and Stephen (`dunamismax`): identity, operating contracts, workstation bootstrap, and cross-repo orchestration.

This repo is intentionally **not** an app monorepo. Product apps live in dedicated sibling repositories under `~/github`.

## What Lives Here

- Identity + operations contracts: `SOUL.md`, `AGENTS.md`
- Root orchestration scripts: `scripts/`
- Shared local infrastructure: `infra/` (PostgreSQL via Docker Compose)
- Durable operational docs: `docs/`
- Encrypted SSH continuity artifacts: `vault/ssh/`

## Stack Baseline

The application stack baseline for managed projects is:

- Python 3.12+ with FastAPI
- PostgreSQL (Dockerized) + asyncpg + raw SQL (no ORM)
- dbmate for SQL migrations
- Pydantic v2 for validation and serialization
- Jinja2 + HTMX for frontend (no-build SSR)
- PicoCSS + vanilla CSS for styling
- pytest + httpx for testing
- ruff for linting/formatting, mypy for type checking
- uv for dependency and environment management
- Docker + Docker Compose for local orchestration
- Coolify for self-hosted push-to-deploy operations

## Prerequisites

- `python` (3.12+)
- `uv`
- `docker` + `docker compose`
- `git`
- `ssh`
- `curl`
- `tar`

## Quick Start

Run from `~/github/scryai`:

```bash
uv sync
uv run scry-bootstrap
uv run scry-doctor
```

## New Machine Bootstrap

```bash
mkdir -p ~/github
cd ~/github
git clone git@github.com:dunamismax/scryai.git
cd scryai
uv sync

# optional if encrypted SSH backup exists
export SCRY_SSH_BACKUP_PASSPHRASE='use-a-long-unique-passphrase'
uv run scry-setup-ssh-restore

uv run scry-setup-workstation
uv run scry-bootstrap
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
uv run scry-bootstrap
uv run scry-setup-workstation
uv run scry-setup-ssh-backup
uv run scry-setup-ssh-restore
uv run scry-setup-storage
uv run scry-doctor

# managed projects
uv run scry-projects-list
uv run scry-projects-doctor
uv run scry-projects-install
uv run scry-projects-verify

# infra
docker compose --env-file infra/.env -f infra/docker-compose.yml up -d
docker compose --env-file infra/.env -f infra/docker-compose.yml down
docker compose --env-file infra/.env -f infra/docker-compose.yml logs -f

# root quality gates
uv run ruff check .
uv run ruff format --check .
uv run mypy scripts
uv run pytest
```

## CI/CD Scope (This Repo)

`/home/sawyer/github/scryai` CI validates root orchestration/docs/scripts only.

Product app CI runs in their own repositories.

## Repository Layout

| Path | Purpose |
|---|---|
| `scripts/` | Orchestration, setup, and verification scripts. |
| `scripts/projects_config.py` | Managed project inventory and command policy. |
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
