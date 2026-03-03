# OpenClaw Backup & Recovery Plan

Last updated: 2026-03-03

This document covers backup layers for Stephen's local OpenClaw deployment and how to prove recovery.

## Backup Layers

## 1) System-level backup (Time Machine)
- Scope: full Mac host (apps, files, local state)
- Source of truth: macOS Time Machine
- Why it matters: bare-metal recovery path if disk is lost/corrupted

## 2) Git-backed operational docs/state (non-secrets)
- Source: `~/.openclaw/workspace`
- Mirrored to: `~/github/grimoire/openclaw/*`
- Redundancy: pushed to both GitHub + Codeberg
- Schedule: daily sync job (`sync-openclaw-workspace`, OpenClaw cron @ 03:00 ET)

## 3) Encrypted critical config backup (secrets included)
- Command: `bun run scry:setup:config_backup`
- Encrypted output: `~/github/grimoire/vault/config/critical-configs.tar.enc`
- Metadata: `~/github/grimoire/vault/config/critical-configs.meta.json`
- Encryption: AES-256-GCM with PBKDF2 key derivation
- Passphrase storage: macOS Keychain item `scry.openclaw.config-backup.passphrase`

---

## Automation Implemented

## Daily encrypted critical backup + integrity verification
- Script: `~/github/grimoire/scripts/ops/daily-openclaw-backup.sh`
- Scheduler: LaunchAgent `com.scry.openclaw.backup`
- Time: daily at 02:20 local time
- Daily run executes:
  1. `bun run scry:setup:config_backup`
  2. `bun run scry:verify:config_backup`
  3. `bun run scry:sync:openclaw -- --commit`
- Logs:
  - `~/Library/Logs/scry/openclaw-critical-backup.log`
  - `~/Library/Logs/scry/openclaw-backup.launchd.out.log`
  - `~/Library/Logs/scry/openclaw-backup.launchd.err.log`

## Install/reinstall scheduler
```bash
cd ~/github/grimoire
./scripts/ops/install-openclaw-backup-launchagent.sh
```

## Seed or rotate backup passphrase in Keychain
```bash
# set/update manually
security add-generic-password -U -a "$USER" -s "scry.openclaw.config-backup.passphrase" -w '<new-passphrase>'
```

---

## Monitoring & Reminders

Configured OpenClaw cron jobs:
- `healthcheck:backup-freshness` — daily 06:10 ET metadata age check (alerts only on failure/staleness).
- `healthcheck:restore-drill-reminder` — monthly reminder on day 1 at 10:00 ET.

---

## Recovery Proof: Restore Drill Checklist

Run this monthly (or after major OpenClaw config changes).

1. Validate backup freshness
   - Confirm metadata timestamp in `critical-configs.meta.json` is < 24h old for daily SLA.

2. Validate encryption artifact integrity
   - `shasum -a 256 ~/github/grimoire/vault/config/critical-configs.tar.enc`
   - Confirm file is readable and non-zero size.

3. Perform sandbox restore test (no overwrite of live files)
   - Restore encrypted archive into a temporary directory.
   - Confirm required paths exist in restored output:
     - `.openclaw/openclaw.json`
     - `.openclaw/credentials`
     - `.openclaw/cron/jobs.json`
     - `.openclaw/identity`

4. Verify OpenClaw startup viability from restored config (dry validation)
   - Validate JSON syntax and critical fields in restored `openclaw.json`.
   - Confirm permissions on sensitive files are restrictive.

5. Record the drill
   - Date/time
   - Who ran it
   - Commands used
   - Pass/fail
   - Any follow-up fixes

Template entry:
```text
Restore Drill — YYYY-MM-DD
- Freshness check: PASS/FAIL
- Artifact integrity: PASS/FAIL
- Sandbox restore: PASS/FAIL
- Critical paths present: PASS/FAIL
- Follow-ups: ...
```

---

## Notes

- `vault/` is gitignored by default. Encrypted artifacts stay local unless intentionally copied elsewhere.
- Keep passphrase escrow strategy out-of-band (password manager + emergency access plan).
- Never store plaintext backup passphrases in repo files.
