# BUILD.md

**Current status:** phase = phase 2 complete (pending exec approval for propagation) · last updated = 2026-03-07 09:25 America/New_York · latest relevant commit = uncommitted workspace + grimoire pass

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

## Immediate next pass priorities

1. Approve pending exec commands for `specialists:harden` and `sync:openclaw`.
2. After propagation, run `openclaw:audit` to verify no drift remains.
3. Consider whether any specialist-specific CLAUDE.md templates need updating (currently only contributor and luma have templates in the hardening script).
