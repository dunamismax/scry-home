# scryai

Operations CLI and identity hub for **scry** — Stephen Sawyer's AI engineering partner. Manages workstation setup, project orchestration, SSH key backup/restore, and cross-repo health checks across all `dunamismax` repositories.

## Features

- **Project orchestration** — list, install, verify, and doctor-check all repos under `~/github`
- **Workstation bootstrap** — automated setup for a fresh development machine
- **SSH key management** — backup and restore SSH keys and config
- **Remote sync** — verify and fix dual-push remotes (GitHub + Codeberg) across all repos
- **Work desktop sync** — sync work files between machines
- **Health checks** — validate prerequisites, dependencies, and project state

## Prerequisites

- [Bun](https://bun.sh) 1.3+

## Quick Start

```bash
git clone https://github.com/dunamismax/scryai.git
cd scryai
bun install
bun run scry:bootstrap
bun run scry:doctor
```

## Commands

| Command | Description |
|---|---|
| `bun run scry:bootstrap` | Full workstation bootstrap |
| `bun run scry:doctor` | Verify prerequisites and project health |
| `bun run scry:setup:workstation` | Set up development machine |
| `bun run scry:setup:ssh_backup` | Backup SSH keys and config |
| `bun run scry:setup:ssh_restore` | Restore SSH keys from backup |
| `bun run scry:projects:list` | List all managed projects |
| `bun run scry:projects:doctor` | Health check across all repos |
| `bun run scry:projects:install` | Install dependencies in all repos |
| `bun run scry:projects:verify` | Run lint + typecheck across all repos |
| `bun run scry:sync:remotes` | Check dual-remote config (add `-- --fix` to apply) |
| `bun run scry:sync:work-desktop` | Sync work desktop files |
| `bun run lint` | Biome lint check |
| `bun run typecheck` | TypeScript type check |

## Project Structure

```
scripts/
  cli.ts                # CLI entry point and command router
  common.ts             # Shared utilities
  projects.config.ts    # Project registry and metadata
  tasks/                # Individual task implementations
SOUL.md                 # scry identity and product taste
AGENTS.md               # Execution contract and done criteria
PROJECT_IDEAS.md        # Ideas backlog
```

## Stack

- **Runtime**: Bun
- **Language**: TypeScript 5.9
- **Tooling**: Biome

## What is scry?

scry is an AI engineering partner identity — not an assistant, a high-agency collaborator. The contracts in `SOUL.md` and `AGENTS.md` define how scry operates: direct, opinionated, reality-first, with strict quality gates and no corporate filler.

## License

[MIT](LICENSE)
