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
bun run scry:doctor
```

## Scripts

```bash
bun run scry:doctor           # Verify prerequisites and project health
bun run scry:projects:doctor  # Check all managed repos
bun run scry:sync:remotes     # Configure dual push remotes
bun run scry:sync:openclaw    # Sync workspace → repo
bun run scry:setup:config_backup  # Create/update encrypted critical config backup
```

## OpenClaw Backups

- Backup policy and restore drill checklist: `openclaw/BACKUPS.md`
- Daily backup runner: `scripts/ops/daily-openclaw-backup.sh`
- LaunchAgent installer: `scripts/ops/install-openclaw-backup-launchagent.sh`

## OpenClaw Capability Planning

- Max-capability integration roadmap: `openclaw/MAX-CAPABILITIES-PLAYBOOK.md`
