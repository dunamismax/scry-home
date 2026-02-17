# scryai

Canonical home-base repository for **scry** and Stephen (`dunamismax`): identity, operating contracts, workstation bootstrap, and cross-repo orchestration.

This repo is intentionally **not** an app monorepo. Product apps live in dedicated sibling repositories under `~/github`.

## What Lives Here

- Identity + operations contracts: `SOUL.md`, `AGENTS.md`
- Root orchestration tasks: `lib/tasks/`
- Shared infrastructure notes: `infra/` (optional manifests, not required by the core stack)
- Durable operational docs: `docs/`
- Encrypted SSH continuity artifacts: `vault/ssh/`

## Stack Baseline

The application stack baseline for managed projects is:

- Ruby 3.2+ with Rails 8 (The One Person Framework)
- SQLite + ActiveRecord
- ActiveJob with `:async` (in-process background jobs)
- Rails cache via `:memory_store` (or `:file_store`)
- Devise + Pundit for authentication and authorization
- Hotwire (Turbo + Stimulus) for frontend
- Tailwind CSS for styling
- Minitest for testing
- RuboCop for linting/formatting
- Bundler for dependency management
- Ubuntu self-hosting with Caddy reverse proxy

## Prerequisites

- `ruby` (3.2+)
- `bundler`
- `git`
- `ssh`
- `curl`

## Quick Start

Run from `~/github/scryai`:

```bash
bundle install
bundle exec rake scry:bootstrap
bundle exec rake scry:doctor
```

## New Machine Bootstrap

```bash
mkdir -p ~/github
cd ~/github
git clone git@github.com:dunamismax/scryai.git
cd scryai
bundle install

# optional if encrypted SSH backup exists
export SCRY_SSH_BACKUP_PASSPHRASE='use-a-long-unique-passphrase'
bundle exec rake scry:setup:ssh_restore

bundle exec rake scry:setup:workstation
bundle exec rake scry:bootstrap
```

`setup:workstation` guarantees:
- `~/github/scryai` bootstrap anchor is present first
- `~/github/dunamismax` profile repo is present second
- repositories parsed from `~/github/dunamismax/REPOS.md` are cloned/fetched
- if parsing yields zero repos, the command fails fast by default
- `USE_FALLBACK=1` enables fallback discovery-only mode (no fallback remote mutations)
- dual `origin` push URLs are enforced (GitHub + Codeberg)

## Root Commands

```bash
# setup / health
bundle exec rake scry:bootstrap
bundle exec rake scry:setup:workstation
bundle exec rake scry:setup:ssh_backup
bundle exec rake scry:setup:ssh_restore
bundle exec rake scry:setup:storage
bundle exec rake scry:doctor

# managed projects
bundle exec rake scry:projects:list
bundle exec rake scry:projects:doctor
bundle exec rake scry:projects:install
bundle exec rake scry:projects:verify

# root quality gates
bundle exec rubocop
bundle exec rake test
```

## CI/CD Scope (This Repo)

`/home/sawyer/github/scryai` CI validates root orchestration/docs/tasks only.

Product app CI runs in their own repositories.

## Repository Layout

| Path | Purpose |
|---|---|
| `lib/tasks/` | Orchestration, setup, and verification Rake tasks. |
| `lib/scry/` | Shared Ruby modules (helpers, project config). |
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
