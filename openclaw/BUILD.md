# BUILD.md

**Current status:** phase = canonical doc refresh merged and synced · last updated = 2026-03-07 14:30 America/New_York · latest relevant commit = live workspace docs refreshed; mirror sync completed

## Phase plan

### Phase 1 — Audit
- [x] Read canonical identity and operating files
- [x] Check runtime/session status
- [x] Inspect cron health at a high level
- [x] Identify missing, stale, or contradictory workspace docs
- [x] Pull external best-practice references for agent operating manuals/orchestration

### Phase 2 — Improvements to apply directly
- [x] Create missing bootstrap/startup guidance
- [x] Tighten AGENTS.md routing, reporting, verification, and memory hygiene rules
- [x] Tighten SOUL.md judgment/personality/ownership guidance without sanding off existing strengths
- [x] Fix stale references in workspace notes
- [x] Add/update durable memory only if the change is truly long-lived
- [x] Add today's daily memory entry

### Phase 3 — Verify
- [x] Re-read changed files for consistency
- [x] Confirm no cron failures were introduced or left unreported
- [x] Reconcile BUILD.md with actual workspace state

## Verification snapshot

- Session/runtime check: `session_status` confirms OpenClaw 2026.3.3 on `openai-codex/gpt-5.4`, healthy active session, current time 2026-03-07 08:57 EST.
- Cron health snapshot: 11 jobs listed; no failing/stuck jobs observed in the returned scheduler state. Recent jobs with state data showed `lastStatus: ok`.
- Workspace doc consistency: re-read `SOUL.md`, `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `TOOLS.md`, `HEARTBEAT.md`, and `MEMORY.md` after edits; changes are internally consistent.
- 2026-03-07 doc refresh: canonical `SOUL.md`, `AGENTS.md`, and `CLAUDE.md` updated from reviewed `improved_files` proposals, with stale bench guidance filtered out.
- Mirror propagation: `cd ~/github/scry-home && uv run python -m scripts sync:openclaw` ✅ copied updated root and `openclaw/` mirror docs.
- Known drift repaired: missing `BOOTSTRAP.md`, missing `BUILD.md`, stale `TOOLS.md` reference to a workspace-local `CONTRIBUTING_TO_OPENCLAW.md`.

### Phase 4 — Propagation
- [x] Run `specialists:harden` to deploy updated templates/hooks/smoke to specialist workspaces
- [x] Run `sync:openclaw` to mirror canonical workspace into grimoire
- [ ] Run `openclaw:audit` to verify full-stack consistency
- [ ] Consider `cron:reconcile --scope=all --apply` to converge all manifest jobs

### Phase 5 — Audit fix
- [x] Diagnose false-positive path checks in `openclaw:audit`
- [x] Patch trailing-whitespace / markdown-punctuation trimming in path extraction
- [ ] Re-run `openclaw:audit`

### Phase 6 — Agent roster cutover
- [x] Replace the old bench (`reviewer`, `builder-mobile`, `openclaw-maintainer`, `contributor`) with the new bench (`scribe`, `research`, `operator`) in live config and docs
- [x] Rework specialist workspaces so all active agents share Scry-aligned soul/voice with domain-specific AGENTS/CLAUDE overlays
- [x] Update Discord channel routing to the final 7-channel roster
- [x] Reconcile cron/sync/hardening automation with the new active specialist list
- [x] Verify new agents are live and reachable

### Phase 7 — Canonical doc refresh from `improved_files`
- [x] Review proposed `SOUL`, `AGENTS`, and `CLAUDE` rewrites against live workspace docs
- [x] Merge worthwhile improvements without reintroducing stale bench/runtime guidance
- [x] Update canonical workspace docs and repo-root `CLAUDE.md`
- [x] Run `sync:openclaw` so repo-root and `openclaw/` mirror copies match the live workspace

## Immediate next pass priorities

1. Re-run `openclaw:audit` after the doc refresh and fix any remaining mirror/path drift.
2. Optionally run `specialists:harden` if future changes need to propagate new shared templates or shared specialist-doc structure.
3. Optionally prune any legacy Discord text channels that still exist unbound in the guild UI.
