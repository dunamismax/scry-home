# grimoire — Build Tracker

**Status:** Phase 1 — Active maintenance, workstation-backup consolidation, and specialist sync  
**Last Updated:** 2026-03-07  
**Latest Relevant Commit:** `6621ffb`

---

## What This Repo Is

Scry's operational control plane. It holds canonical identity docs, Python CLI automation, an OpenClaw workspace mirror, encrypted backup artifacts, and a small Bun/Biome layer for formatting and linting repo files.

## Architecture Snapshot

```text
grimoire/
├── SOUL.md, AGENTS.md          # Canonical identity and operating rules
├── BUILD.md                    # Current repo state ledger
├── workstation/                # Tracked workstation config snapshots (former dotfiles content)
├── openclaw/                   # OpenClaw workspace mirror (do not edit directly)
├── scripts/
│   ├── cli.py                  # Unified CLI entry point
│   ├── common.py               # Shared subprocess/logging/path helpers
│   ├── crypto.py               # Encryption helpers for backup tooling
│   ├── projects_config.py      # Managed repo registry + verification commands
│   ├── snapshot.py             # Fingerprinting / snapshot helpers
│   ├── ops/                    # Shell automation for workstation/OpenClaw backups + launch agents
│   └── tasks/                  # Individual CLI commands
│       ├── doctor.py
│       ├── bootstrap.py
│       ├── projects.py
│       ├── sync_openclaw.py
│       ├── sync_remotes.py
│       ├── reconcile_cron.py
│       └── setup_*.py
├── reference/                  # Reference docs and issue candidate notes
├── vault/                      # Encrypted sensitive backups
├── package.json                # Bun scripts for Biome + command shortcuts
└── pyproject.toml              # Python project metadata + Ruff config
```

**Stack:** Python + uv for automation, Ruff for Python lint/format, Bun + Biome for repo-wide formatting/lint where useful.

---

## Phase Plan

### Phase 1 — Core Operations (current)

- [x] Canonical identity docs and OpenClaw mirror established
- [x] Python CLI scaffold with unified `scripts/cli.py` entrypoint
- [x] Workspace sync, remote sync, project doctor, backup, and cron tooling
- [x] Specialist workspace mirror under `openclaw/specialists/`
- [x] Encrypted config backup artifacts and verification tooling
- [x] Imported former `dotfiles` workstation snapshots and backup automation into `workstation/` + `scripts/ops/`
- [x] Added reusable specialist self-improvement master prompt template under `openclaw/templates/agents/`
- [x] Reconciled obvious stale specialist-doc conflicts before sync (`openclaw-maintainer`, `contributor`)
- [x] Removed stale prompt templates that no longer reflect active work
- [x] Removed stale repo artifacts (`.DS_Store`, `tsconfig.tsbuildinfo`, dead `bunfig.toml`)
- [x] Trimmed unused TypeScript dev dependencies from `package.json`
- [x] Consolidated OpenClaw contribution guide to `reference/`
- [x] Removed stale `PROJECT_IDEAS.md`

### Phase 2 — Reliability and hygiene

- [x] Extend sync script to mirror all `.md` files (root + subdirs) from main and specialist workspaces
- [x] Add `openclaw:audit` CLI command for doc drift / stale path detection
- [x] Extend `specialists:harden` to propagate `USER.md`, `TOOLS.md`, updated `BOOTSTRAP.md`, and broader identity/reporting rules
- [x] Update smoke scripts to check broader required file set (`USER.md`, `TOOLS.md`, `BOOTSTRAP.md`)
- [x] Create live `healthcheck:workspace-doc-drift` cron job (daily, 3:40 AM)
- [x] Update `healthcheck:agent-bench-daily` to check expanded file set
- [x] Add drift job to `reconcile_cron.py` manifest for future reconciliation
- [ ] Add clearer per-command CLI help / flag docs
- [ ] Expand tests if Python task complexity grows enough to justify them

---

## Verification Snapshot

Current workstation-consolidation pass verified on 2026-03-07:

- `bash -n scripts/ops/backup-macos-configs.sh` ✅
- `bash -n scripts/ops/run-automated-backups.sh` ✅
- `bash -n scripts/ops/install-backup-launchagent.sh` ✅
- `bash scripts/ops/backup-macos-configs.sh` ✅ refreshed `workstation/macOS/metadata/backup-inventory.txt`
- `uv run ruff check scripts/tasks/setup_config_backup.py` ✅
- `bun run lint` ⚠️ still fails on pre-existing Ruff issues in mirrored `openclaw/` scripts plus an existing unused import in `scripts/tasks/audit_openclaw_docs.py`; imported snapshot artifacts are now excluded from Biome checks via `biome.json`

---

## Agent Instructions

- **Canonical sync direction:** OpenClaw workspace → grimoire. Do not hand-edit mirrored files under `openclaw/` unless the source-of-truth rule is intentionally being changed.
- Keep this file current when repo structure or operational state changes.
- Prefer deletion of generated or stale artifacts over keeping ambiguous dead weight around.
- Ask before deleting material that may still serve as backlog, reference, or historical record.

## Immediate Next Pass Priorities

1. Keep the existing nightly OpenClaw/grimoire flow as the long-term single scheduler; treat the imported interval LaunchAgent helper as legacy/manual-only.
2. Re-run `openclaw:audit` after the trailing-whitespace path-fix patch.
3. Scan for any remaining dangling references to removed prompt/project-idea docs.
4. Consider whether `cron:reconcile --scope=all --apply` should converge the new drift audit job from manifest instead of the manually-created live copy.
