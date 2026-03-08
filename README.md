# scry-home

<p align="center">
  <img src="assets/images/scry-clawdbot-profile.jpg" width="200" alt="Scry" />
</p>

Personal control plane for Scry and the local OpenClaw workspace.

Python-only ops repo. No Bun, Biome, or Node-based toolchain is required here.

This repo is the versioned home for:
- operator docs copied out of the live OpenClaw workspace
- local backup and restore automation
- workstation bootstrap and config snapshots
- small repo-management and audit scripts
- CAB / Change Factory packets for repo work

The live OpenClaw workspace is canonical for synced identity files. This repo is the durable export and operations repo around that workspace.

## Active Keeper Repos

`projects:doctor` and workstation bootstrap treat this as the active keeper set:

- `scry-home`
- `dunamismax`
- `boring-go-web`
- `c-from-the-ground-up`
- `scryfall-discord-bot`
- `hello-world-from-hell`
- `trade-desk-cli`
- `Sawyer-Visual-Media`
- `openclaw` — contribution clone at `~/github/openclaw`; live git install remains at `~/openclaw`

## What This Repo Is

- `SOUL.md` / `AGENTS.md` — synced copies of canonical workspace docs
- `reference/` — CAB templates and dated historical review notes
- `scripts/` — CLI tasks for sync, bootstrap, backup, remotes, and audits
- `workstation/` — tracked workstation config snapshots folded in from the former `dotfiles` repo
- `openclaw/` — auto-synced from OpenClaw workspace (do not edit directly)
- `vault/` — encrypted backup artifacts

## Setup

```bash
git clone git@github.com-dunamismax:dunamismax/scry-home.git
cd scry-home
uv sync
uv run python -m scripts doctor
```

## Core Commands

```bash
uv run ruff check .                     # Repo lint
uv run python -m scripts cab:new --project=scry-home --packet=repo-control-plane-slice
uv run python -m scripts doctor           # Verify prerequisites and project health
uv run python -m scripts projects:doctor  # Check active keeper repos tracked by this repo
uv run python -m scripts sync:remotes     # Configure dual push remotes
uv run python -m scripts sync:openclaw    # Sync OpenClaw workspace → this repo
uv run python -m scripts setup:config_backup  # Create/update encrypted critical config backup
```

## CAB / Change Factory

- Workflow doc: `reference/cab/WORKFLOW.md`
- Template pack: `reference/cab/templates/`
- Default packet output: `artifacts/cab/`
- Research Forge is folded into each packet via `09-research-memo.md` and `research/source-log.md`

Example:

```bash
uv run python -m scripts cab:new --project=scry-home --packet=repo-control-plane-slice
uv run python -m scripts cab:new --project=openclaw --packet=weekly-review --dry-run
```

## Workstation Snapshots

- Snapshot tree: `workstation/`
- Refresh tracked macOS configs: `bash scripts/ops/backup-macos-configs.sh`
- The long-term scheduler is the existing nightly OpenClaw-to-`scry-home` flow.
- `scripts/ops/install-backup-launchagent.sh` is retained only as an imported legacy helper from the former `dotfiles` repo.
- Combined runner: `scripts/ops/run-automated-backups.sh`

## OpenClaw Backups

- Daily backup runner: `scripts/ops/daily-openclaw-backup.sh`
- LaunchAgent installer: `scripts/ops/install-openclaw-backup-launchagent.sh`
- Sensitive/manual backup scope notes: `workstation/macOS/metadata/manual-items.md`

## OpenClaw Templates

- GitHub agent prompt templates: `openclaw/templates/github/`
- Integration checklist template: `openclaw/templates/integrations/INTEGRATION-CHECKLIST.md`
