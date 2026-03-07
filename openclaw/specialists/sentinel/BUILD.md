# BUILD.md

## Task
Audit and improve Sentinel's own security/hardening operating model.

## Status
- Phase: complete
- Outcome: contract tightened, drift removed, smoke coverage expanded, and a recurring weekly self-check was scheduled

## Checklist
- [x] Review Sentinel core instruction files
- [x] Identify drift, ambiguity, and weak guardrails
- [x] Tighten runtime contract and reporting rules
- [x] Improve bootstrap and identity guidance
- [x] Strengthen self-smoke verification coverage
- [x] Schedule a recurring Sentinel self-check
- [x] Run executable verification checks
- [x] Confirm workspace tracking model (not a git repo; backed up/synced via `scry-home`)

## Verification Snapshot
- File-level review completed for `SOUL.md`, `AGENTS.md`, `CLAUDE.md`, `BOOTSTRAP.md`, `IDENTITY.md`, and existing hook/smoke scripts.
- `healthcheck:sentinel-weekly-smoke` scheduled for Mondays at 10:22 ET.
- Executed `./scripts/specialist-weekly-smoke.sh` via the scheduler: contract integrity 10/10, verification discipline 10/10, attribution compliance 10/10, overall 10/10.
- Confirmed `~/.openclaw/workspace-sentinel` is intentionally not a tracked git repo; backup/sync flows through `scry-home`.

## Next Pass Priorities
1. Confirm `AGENTS.md` and `CLAUDE.md` remain identical after future edits.
2. Keep the weekly Sentinel smoke in place and investigate only on failure.
3. Defer sync work until explicitly requested.