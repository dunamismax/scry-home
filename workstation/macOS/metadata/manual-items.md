# Manual / privileged items

These files are intentionally not auto-copied by `scripts/ops/backup-macos-configs.sh`.

- `/etc/sudoers` (not readable without elevated privileges)
- Any private keys (`~/.ssh/id_*`)
- OpenClaw credential + identity stores (`~/.openclaw/credentials/`, `~/.openclaw/identity/`, `~/Library/Application Support/OpenClaw/identity/`)
- OpenClaw runtime secrets (`~/.openclaw/devices/paired.json`, `~/.openclaw/exec-approvals.json`)
- Any local credential stores and token/session databases (Codex/Claude/OpenClaw/etc)

Notes:

- Readable files under `/etc/sudoers.d/` are auto-copied.
- `~/.openclaw/openclaw.json` is copied in redacted form for reproducible config tracking.
- Sensitive agent state should be captured in encrypted backups under `grimoire/vault/`.

If you want a privileged one-off backup of `/etc/sudoers`, run:

```bash
sudo cp /etc/sudoers /Users/sawyer/github/grimoire/workstation/macOS/etc/sudoers
```

Review `macOS/etc/sudoers` before committing.
