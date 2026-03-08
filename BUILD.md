# scry-home — Build Tracker

**Status:** Python-only repo cleanup verified; local commit blocked by sandbox
**Last Updated:** 2026-03-08
**Latest Relevant Commit:** pending local checkpoint commit for Python-only cleanup

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

### Phase 1 — Inventory and migration plan

- [x] Read repo control docs and current implementation before editing
- [x] Inventory repo-owned Bun/Biome/TypeScript references and obsolete manifests
- [x] Record a truthful Python-only migration plan in this tracker

### Phase 2 — Repo-owned tooling realignment

- [x] Remove root Bun/Biome manifests and lockfiles that are no longer part of the implementation
- [x] Update repo bootstrap, doctor, and managed-project metadata to use Python-native checks for `scry-home`
- [x] Replace repo lint/verification guidance with `uv` + Ruff commands
- [x] Keep mirrored `openclaw/` files untouched

### Phase 3 — Docs and helper cleanup

- [x] Rewrite repo-owned docs to describe a Python-first ops repo without Bun/Biome defaults
- [x] Remove or trim stale review/helper material that still prescribes the old JS stack for this repo
- [x] Update generated specialist hardening templates so future synced policy output no longer reintroduces Bun defaults

### Phase 4 — Verification and checkpoint

- [x] Run Ruff across the repo-owned Python surface
- [x] Run the repo doctor and managed-project doctor
- [x] Syntax-check the modified Python entrypoints/modules
- [x] Reconcile this tracker with the final state
- [ ] Create a local commit if the checkpoint verifies cleanly

---

## Acceptance Checks

- `uv run ruff check .`
- `UV_CACHE_DIR=/tmp/uv-cache-scry-home uv run python -m scripts bootstrap`
- `uv run python -m scripts doctor`
- `uv run python -m scripts projects:doctor`
- `uv run python -m py_compile scripts/cli.py scripts/projects_config.py scripts/tasks/bootstrap.py scripts/tasks/doctor.py scripts/tasks/harden_specialists.py scripts/tasks/projects.py`

---

## Verification Snapshot

- `UV_CACHE_DIR=/tmp/uv-cache-scry-home uv run ruff check .` ✅
- `UV_CACHE_DIR=/tmp/uv-cache-scry-home uv run python -m scripts bootstrap` ✅ prerequisite check passed; local repo env synced; managed project installs now remain explicit
- `uv run python -m scripts doctor` ✅ toolchain/core-file check passed; managed-project inventory still reports missing local clones for `boring-go-web`, `c-from-the-ground-up`, and `hello-world-from-hell`
- `uv run python -m scripts projects:doctor` ✅ managed-project inventory ran; same three local clones are absent
- `UV_CACHE_DIR=/tmp/uv-cache-scry-home uv run python -m py_compile scripts/cli.py scripts/projects_config.py scripts/tasks/bootstrap.py scripts/tasks/doctor.py scripts/tasks/harden_specialists.py scripts/tasks/projects.py` ✅
- Note: `uv` cache writes to `~/.cache/uv` are blocked by this sandbox, so cache-backed checks were rerun with `UV_CACHE_DIR=/tmp/uv-cache-scry-home`

---

## Immediate Next Pass Priorities

1. Create the local commit for this verified Python-only cleanup checkpoint.
2. If the synced root `SOUL.md` / `AGENTS.md` changes should persist beyond this repo, propagate them upstream in the canonical OpenClaw workspace and re-sync.
3. Revisit keeper-set policy separately if Stephen wants the managed project inventory itself narrowed to Python/Rust-only repos.

---

## Blockers / Human Decisions

- Root `SOUL.md` and `AGENTS.md` are sync-governed copies, so their Python/Rust stack-policy edits in this repo can be overwritten by the next upstream sync unless the canonical workspace is updated separately.
- This sandbox cannot create `/Users/sawyer/github/scry-home/.git/worktrees/stack-realign-20260308-105446/index.lock`, so the local commit must be created outside this lane even though the checkpoint verified cleanly.
