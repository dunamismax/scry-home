# Workstation Snapshots

Tracked workstation configuration snapshots imported from the former standalone `dotfiles` repo.

## Structure

```text
workstation/
├── macOS/
│   ├── home/           # Selected files from /Users/sawyer
│   ├── etc/            # Selected files from /etc
│   └── metadata/       # Inventory and manual follow-up notes
└── linux/
    └── wsl/home/       # WSL shell configs
```

## Purpose

- Keep a readable, versioned copy of high-value workstation config in `grimoire`
- Separate tracked plaintext snapshots here from encrypted artifacts in `vault/`
- Use `scripts/ops/backup-macos-configs.sh` to refresh the macOS snapshot tree
- Use `scripts/ops/run-automated-backups.sh` or `scripts/ops/install-backup-launchagent.sh` for scheduled refresh + encrypted backups

## Coverage

- Shell and terminal config
- SSH client/server config
- Docker, Codex, Claude, htop, and jgit config
- OpenClaw non-secret config
- Ghostty and VS Code / VS Code Insiders user config
- User LaunchAgents
- Readable system config under `/etc`

## Security

- Private keys, credentials, tokens, caches, and app-state databases stay out of this tree
- Imported snapshots are redacted where needed before being written here
- Sensitive restore material belongs in `vault/`, not in `workstation/`
