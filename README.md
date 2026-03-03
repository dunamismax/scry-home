# scryai

<p align="center">
  <img src="./assets/images/scry-clawdbot-profile.jpg" alt="Scry / ClaudBot profile icon" width="220" />
</p>

Operations hub and identity source of truth for **Scry** — Stephen Sawyer's AI engineering partner. TypeScript + Bun, Anthropic Claude exclusively, orchestrated through [OpenClaw](https://openclaw.ai).

## What This Is

This repo is three things:

1. **Identity source of truth.** `SOUL.md` and `AGENTS.md` define who Scry is and how Scry operates — across every surface (OpenClaw chat, Claude Code, Codex, whatever comes next).
2. **OpenClaw workspace backup.** The `openclaw/` directory is automatically synced from the OpenClaw workspace: memory logs, identity files, cron jobs. Non-secret configuration that should survive a machine loss.
3. **Operations CLI.** TypeScript scripts for workstation bootstrap, project orchestration, encrypted config backups, SSH key management, and cross-repo health checks.

## Prerequisites

- [Bun](https://bun.sh) 1.3+

## Quick Start

```bash
git clone https://github.com/dunamismax/scryai-typescript.git
cd scryai-typescript
bun install
bun run scry:doctor
```

## Commands

| Command | Description |
|---|---|
| `bun run scry:bootstrap` | Full workstation bootstrap |
| `bun run scry:doctor` | Verify prerequisites and project health |
| `bun run scry:setup:workstation` | Set up a fresh development machine |
| `bun run scry:setup:config_backup` | Encrypted backup of critical workstation + OpenClaw config |
| `bun run scry:setup:ssh_backup` | Backup SSH keys and config |
| `bun run scry:setup:ssh_restore` | Restore SSH keys from encrypted backup |
| `bun run scry:sync:openclaw` | Sync OpenClaw workspace → repo (`--commit` to auto-push) |
| `bun run scry:sync:remotes` | Check dual-remote config (`-- --fix` to apply) |
| `bun run scry:sync:work-desktop` | Sync work desktop files between clouds |
| `bun run scry:projects:list` | List managed projects |
| `bun run scry:projects:doctor` | Health check across all repos |
| `bun run scry:projects:install` | Install deps in all managed repos |
| `bun run scry:projects:verify` | Lint + typecheck across all repos |
| `bun run lint` | Biome lint check |
| `bun run typecheck` | TypeScript type check |

## OpenClaw Workspace Sync

The `openclaw/` directory mirrors non-secret files from the OpenClaw workspace:

```
openclaw/
  IDENTITY.md          # Agent identity metadata
  USER.md              # User profile
  TOOLS.md             # Environment-specific tool notes
  HEARTBEAT.md         # Periodic check configuration
  cron-jobs.json       # Scheduled job definitions
  exec-approvals.json  # Approved exec commands
  memory/              # Daily session memory logs
```

SOUL.md and AGENTS.md sync to the repo root (shared with code agents).

Run manually: `bun run scry:sync:openclaw`
Auto-commit + push: `bun run scry:sync:openclaw -- --commit`

A daily OpenClaw cron job runs the auto-commit variant.

## Encrypted Config Backup

For secrets (tokens, credentials, SSH keys, OpenClaw runtime config):

```bash
export SCRY_CONFIG_BACKUP_PASSPHRASE='use-a-long-random-passphrase'
bun run scry:setup:config_backup
```

Output goes to `vault/config/` (gitignored by default). Include it in your off-site backup strategy.

## Project Structure

```
SOUL.md                 # Scry identity, worldview, voice (synced from OpenClaw)
AGENTS.md               # Operational rules, stack contract (synced from OpenClaw)
CLAUDE.md               # Code agent instructions (points to SOUL.md + AGENTS.md)
PROJECT_IDEAS.md        # Ideas backlog
openclaw/               # Auto-synced OpenClaw workspace files + memory
scripts/
  cli.ts                # CLI entry point and command router
  common.ts             # Shared utilities
  projects.config.ts    # Project registry
  tasks/                # Individual task implementations
vault/                  # Encrypted backups (gitignored)
```

## Stack

- **Runtime:** Bun
- **Language:** TypeScript
- **AI:** Anthropic Claude (exclusively)
- **Orchestration:** OpenClaw
- **Tooling:** Biome

## What is Scry?

Scry is an AI engineering partner — not an assistant, a high-agency collaborator. The contracts in `SOUL.md` and `AGENTS.md` define how Scry operates: direct, opinionated, reality-first, with strict quality gates and no corporate filler. Read `SOUL.md` if you want to understand the philosophy.

## License

[MIT](LICENSE)
