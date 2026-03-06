# grimoire — Build Tracker

**Status:** Phase 1 — Active maintenance and stale-file cleanup  
**Last Updated:** 2026-03-06  
**Latest Relevant Commit:** `d2b46bd`

---

## What This Repo Is

Scry's operational control plane. It holds canonical identity docs, Python CLI automation, an OpenClaw workspace mirror, encrypted backup artifacts, and a small Bun/Biome layer for formatting and linting repo files.

## Architecture Snapshot

```text
grimoire/
├── SOUL.md, AGENTS.md          # Canonical identity and operating rules
├── BUILD.md                    # Current repo state ledger
├── openclaw/                   # OpenClaw workspace mirror (do not edit directly)
├── scripts/
│   ├── cli.py                  # Unified CLI entry point
│   ├── common.py               # Shared subprocess/logging/path helpers
│   ├── crypto.py               # Encryption helpers for backup tooling
│   ├── projects_config.py      # Managed repo registry + verification commands
│   ├── snapshot.py             # Fingerprinting / snapshot helpers
│   └── tasks/                  # Individual CLI commands
│       ├── doctor.py
│       ├── bootstrap.py
│       ├── projects.py
│       ├── sync_openclaw.py
│       ├── sync_remotes.py
│       ├── reconcile_cron.py
│       └── setup_*.py
├── scripts/ops/                # Shell automation for backups / launch agents
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
- [x] Removed stale prompt templates that no longer reflect active work
- [x] Removed stale repo artifacts (`.DS_Store`, `tsconfig.tsbuildinfo`, dead `bunfig.toml`)
- [x] Trimmed unused TypeScript dev dependencies from `package.json`
- [x] Consolidated OpenClaw contribution guide to `reference/`
- [x] Removed stale `PROJECT_IDEAS.md`

### Phase 2 — Reliability and hygiene

- [ ] Add clearer per-command CLI help / flag docs
- [ ] Reconcile any stale workspace-mirror docs via canonical workspace sync
- [ ] Add deterministic verification for cron / backup flows
- [ ] Expand tests if Python task complexity grows enough to justify them

---

## Verification Snapshot

Current cleanup pass verified on 2026-03-06:

- `bun install` ✅ (`3 packages removed`, lockfile updated)
- `bun run lint` ✅
- `uv run python -m scripts doctor` ✅

---

## Agent Instructions

- **Canonical sync direction:** OpenClaw workspace → grimoire. Do not hand-edit mirrored files under `openclaw/` unless the source-of-truth rule is intentionally being changed.
- Keep this file current when repo structure or operational state changes.
- Prefer deletion of generated or stale artifacts over keeping ambiguous dead weight around.
- Ask before deleting material that may still serve as backlog, reference, or historical record.

## Immediate Next Pass Priorities

1. Scan for any remaining dangling references to removed prompt/project-idea docs.
2. Decide whether any additional historical/archive docs deserve pruning.
3. Keep the Python-first repo contract consistent in docs and command shortcuts.
