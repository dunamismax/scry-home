# scry-home — Build Tracker

**Status:** canonical doc refresh, specialist bench inheritance refresh, and rename-drift cleanup complete in working tree  
**Last Updated:** 2026-03-07  
**Latest Relevant Commit:** uncommitted `scry-home` rename cleanup + full audit pass

---

## What This Repo Is

`scry-home` is Stephen's personal control plane for Scry and local OpenClaw operations.

- Versioned export of canonical OpenClaw workspace docs
- Backup and restore automation for critical local state
- Workstation bootstrap and tracked config snapshots
- Small repo-management and audit CLI tasks

The live OpenClaw workspace is canonical. The local `openclaw/` tree is a mirror and should not be hand-edited.

---

## Phase Plan

### Phase 1 — Repo honesty and path cleanup

- [x] Rename local package/project metadata from `grimoire` to `scry-home`
- [x] Rewrite README to describe the repo literally as control plane / ops / backups / bootstrap
- [x] Replace hardcoded `~/github/grimoire` script defaults with path derivation from the checked-out repo
- [x] Update workstation docs and manual notes to point at `scry-home`
- [x] Replace stale managed-project entries with the expected keeper repos
- [x] Remove the fake `typecheck` assumption for this repo's managed verification
- [x] Propagate remaining operational `grimoire` references from the canonical OpenClaw workspace, cron jobs, and launchagent paths; re-sync mirrors

### Phase 2 — Verification

- [x] Run repo lint on repo-owned files
- [x] Run repo doctor
- [x] Syntax-check the updated shell scripts
- [x] Refresh generated workstation inventory metadata
- [x] Re-run `openclaw:audit` after canonical workspace docs are updated upstream

### Phase 3 — Canonical doc + specialist bench refresh

- [x] Merge upgraded canonical `SOUL.md` / `AGENTS.md` / `CLAUDE.md` guidance from reviewed proposals into the live OpenClaw workspace
- [x] Replace repo-root `CLAUDE.md` with a proper repo-local contract
- [x] Rebuild `scripts/tasks/harden_specialists.py` so specialist hardening writes upgraded `SOUL.md`, `AGENTS.md`, and `CLAUDE.md` baselines
- [x] Reapply hardening across all six active specialists
- [x] Re-run every specialist weekly smoke; all six passed 10/10 across protocol, verification, and attribution
- [x] Sync refreshed canonical and specialist docs back into the repo-root and `openclaw/` mirror

---

## Acceptance Checks

- `bun run lint`
- `uv run python -m scripts doctor`
- `bash -n scripts/ops/run-automated-backups.sh`
- `bash -n scripts/ops/install-backup-launchagent.sh`
- `bash -n scripts/ops/daily-openclaw-backup.sh`
- `bash -n scripts/ops/install-openclaw-backup-launchagent.sh`
- `bash scripts/ops/backup-macos-configs.sh`

---

## Verification Snapshot

- `bun run lint` ✅ on the earlier keeper-repo cleanup pass; current repo-wide lint still has pre-existing unrelated Ruff failures in mirrored `openclaw/` scripts outside this doc/hardening change
- `uv run python -m scripts doctor` ✅
- `bash -n scripts/ops/run-automated-backups.sh` ✅
- `bash -n scripts/ops/install-backup-launchagent.sh` ✅
- `bash -n scripts/ops/daily-openclaw-backup.sh` ✅
- `bash -n scripts/ops/install-openclaw-backup-launchagent.sh` ✅
- `bash scripts/ops/backup-macos-configs.sh` ✅ refreshed `workstation/macOS/metadata/backup-inventory.txt` with `repo_root=/Users/sawyer/github/scry-home`
- `cd ~/github/scry-home && uv run ruff check scripts/tasks/harden_specialists.py` ✅
- `cd ~/github/scry-home && uv run python -m scripts specialists:harden` ✅
- bench smoke verification ✅ all six active specialists passed their regenerated `scripts/specialist-weekly-smoke.sh`
- `cd ~/github/scry-home && uv run python -m scripts sync:openclaw` ✅
- `cd ~/github/scry-home && uv run python -m scripts openclaw:audit` ✅ after fixing canonical stale paths, excluding historical `runs/` from mirror/path checks, and skipping stale-path validation for `memory/` history logs
- `launchctl bootstrap gui/$(id -u) /Users/sawyer/Library/LaunchAgents/com.scry.openclaw.backup.plist` ✅ reloaded live backup LaunchAgent with `scry-home` paths

---

## Immediate Next Pass Priorities

1. If desired, run `uv run python -m scripts cron:reconcile --scope=all --apply` to converge any managed-cron manifest drift.
2. Delete non-keeper repos locally only after any remaining useful content has been migrated elsewhere.
3. Tighten any remaining repo docs if future renames introduce new drift.

---

## Blockers / Human Decisions

- No blockers on the canonical-doc / specialist-bench / rename-drift pass. Remaining repo cleanup is optional follow-on work, not a dependency.
