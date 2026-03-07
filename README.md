# Grimoire

<p align="center">
  <img src="assets/images/scry-clawdbot-profile.jpg" width="200" alt="Scry" />
</p>

Scry's identity, configuration, and operational tooling. The canonical source of truth for SOUL.md, AGENTS.md, and supporting infrastructure.

## What's Here

- `SOUL.md` — identity, worldview, voice
- `AGENTS.md` — operational rules, stack contract, verification
- `reference/CONTRIBUTING_TO_OPENCLAW.md` — field guide for OpenClaw contributions
- `scripts/` — CLI tools, sync scripts, project management
- `workstation/` — tracked workstation config snapshots imported from the former `dotfiles` repo
- `openclaw/` — auto-synced from OpenClaw workspace (do not edit directly)
- `vault/` — encrypted backups

## Setup

```bash
git clone git@github.com-dunamismax:dunamismax/grimoire.git
cd grimoire
bun install
uv run python -m scripts doctor
```

## Scripts

```bash
uv run python -m scripts doctor           # Verify prerequisites and project health
uv run python -m scripts projects:doctor  # Check all managed repos
uv run python -m scripts sync:remotes     # Configure dual push remotes
uv run python -m scripts sync:openclaw    # Sync workspace → repo
uv run python -m scripts setup:config_backup  # Create/update encrypted critical config backup
```

## Workstation Snapshots

- Snapshot tree: `workstation/`
- Refresh tracked macOS configs: `bash scripts/ops/backup-macos-configs.sh`
- The long-term scheduler is the existing nightly OpenClaw/grimoire flow.
- `scripts/ops/install-backup-launchagent.sh` is retained only as an imported legacy helper from the former `dotfiles` repo.
- Combined runner: `scripts/ops/run-automated-backups.sh`

## OpenClaw Backups

- Backup policy and restore drill checklist: `openclaw/BACKUPS.md`
- Daily backup runner: `scripts/ops/daily-openclaw-backup.sh`
- LaunchAgent installer: `scripts/ops/install-openclaw-backup-launchagent.sh`

## OpenClaw Templates

- GitHub agent prompt templates: `openclaw/templates/github/`
- Integration checklist template: `openclaw/templates/integrations/INTEGRATION-CHECKLIST.md`
