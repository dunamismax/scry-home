# scry-home — Build Tracker

**Status:** CAB / Change Factory operational slice complete in working tree  
**Last Updated:** 2026-03-07  
**Latest Relevant Commit:** uncommitted local CAB slice for `cab:new` scaffold + workflow/templates

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

### Phase 4 — Keeper-set widening after portfolio decision

- [x] Restore `trade-desk-cli`, `Sawyer-Visual-Media`, and `openclaw` to the managed project inventory
- [x] Update repo-owned docs so the final keeper set is explicit and current again
- [x] Correct OpenClaw contribution guidance so `~/github/openclaw` is the contribution clone while `~/openclaw` remains the live install
- [x] Keep synced `openclaw/` mirror boundaries intact; do not hand-edit mirrored daily/history files here

### Phase 5 — CAB / Change Factory operational slice

- [x] Add a repo-native CAB scaffold command to the existing `uv run python -m scripts ...` surface
- [x] Tie packet scaffolding to managed projects already tracked by `scripts/projects_config.py`
- [x] Ship a reusable CAB template pack for morning brief, weekly review, focus sprint, repo dossier, decision memo, kill memo, adversarial review, build-vs-buy, architecture review packet, and research memo
- [x] Fold Research Forge into CAB packet artifacts instead of creating a separate product surface
- [x] Update repo docs so the new CAB loop is discoverable and runnable
- [x] Keep the CAB slice narrow enough to land as one atomic local commit

---

## Acceptance Checks

- `bun run lint`
- `uv run python -m scripts doctor`
- `uv run python -m scripts cab:new --project=scry-home --packet=repo-control-plane-slice --dry-run`
- `uv run python -m scripts projects:doctor`
- `UV_CACHE_DIR=${UV_CACHE_DIR:-/tmp/uv-cache-scry-home} uv run python -m py_compile scripts/common.py scripts/projects_config.py scripts/tasks/cab.py scripts/tasks/doctor.py scripts/tasks/projects.py`
- `bash -n scripts/ops/run-automated-backups.sh`
- `bash -n scripts/ops/install-backup-launchagent.sh`
- `bash -n scripts/ops/daily-openclaw-backup.sh`
- `bash -n scripts/ops/install-openclaw-backup-launchagent.sh`
- `bash scripts/ops/backup-macos-configs.sh`

---

## Verification Snapshot

- `bun run lint` ✅ Biome checked repo files cleanly and Ruff passed with the new `scripts/tasks/cab.py` task included
- `uv run python -m scripts doctor` ✅ all nine keeper repos reported present
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
- `bun run lint` ✅ (`bunx @biomejs/biome check .` + `uv run ruff check .`)
- `uv run python -m scripts doctor` ✅ all nine keeper repos reported present; `openclaw` still shows upstream `origin` plus PR-target `fork`
- `uv run python -m scripts cab:new --project=scry-home --packet=repo-control-plane-slice --dry-run` ✅ would scaffold 13 packet files under `artifacts/cab/2026-03-07-scry-home-repo-control-plane-slice/`
- `uv run python -m scripts projects:doctor` ✅ all nine keeper repos reported present
- `UV_CACHE_DIR=${UV_CACHE_DIR:-/tmp/uv-cache-scry-home} uv run python -m py_compile scripts/common.py scripts/projects_config.py scripts/tasks/cab.py scripts/tasks/doctor.py scripts/tasks/projects.py` ✅

---

## Immediate Next Pass Priorities

1. Run the CAB packet scaffold against a live repo initiative and keep the generated packet honest as it accumulates real decisions.
2. If desired, run `uv run python -m scripts cron:reconcile --scope=all --apply` to converge any managed-cron manifest drift.
3. Delete non-keeper repos locally only after any remaining useful content has been migrated elsewhere and they are confirmed outside the final nine-repo keeper set.

---

## Blockers / Human Decisions

- No blockers on the CAB slice inside `scry-home`.
- Current Codex sandbox cannot create `.git/index.lock`, so the verified CAB slice is ready but the local commit must be created outside this lane.
- Synced `openclaw/cron-jobs.json` still references a non-mirrored `openclaw/BACKUPS.md` restore checklist; fix that in the canonical OpenClaw workspace and re-sync if Stephen wants the reminder text repaired here too.
