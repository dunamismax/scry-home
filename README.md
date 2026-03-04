# Grimoire

<p align="center">
  <img src="assets/images/scry-clawdbot-profile.jpg" width="200" alt="Scry" />
</p>

Scry's identity, configuration, and operational tooling. The canonical source of truth for SOUL.md, AGENTS.md, and supporting infrastructure.

## What's Here

- `SOUL.md` — identity, worldview, voice
- `AGENTS.md` — operational rules, stack contract, verification
- `CONTRIBUTING_TO_OPENCLAW.md` — field guide for OpenClaw contributions
- `scripts/` — CLI tools, sync scripts, project management
- `openclaw/` — auto-synced from OpenClaw workspace (do not edit directly)
- `vault/` — encrypted backups

## Setup

```bash
git clone git@github.com-dunamismax:dunamismax/grimoire.git
cd grimoire
bun install
python3 -m scripts doctor
```

## Scripts

```bash
python3 -m scripts doctor           # Verify prerequisites and project health
python3 -m scripts projects:doctor  # Check all managed repos
python3 -m scripts sync:remotes     # Configure dual push remotes
python3 -m scripts sync:openclaw    # Sync workspace → repo
python3 -m scripts setup:config_backup  # Create/update encrypted critical config backup
```

## OpenClaw Backups

- Backup policy and restore drill checklist: `openclaw/BACKUPS.md`
- Daily backup runner: `scripts/ops/daily-openclaw-backup.sh`
- LaunchAgent installer: `scripts/ops/install-openclaw-backup-launchagent.sh`

## OpenClaw Templates

- GitHub agent prompt templates: `openclaw/templates/github/`
- Integration checklist template: `openclaw/templates/integrations/INTEGRATION-CHECKLIST.md`
