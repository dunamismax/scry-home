# BUILD.md

**Current status:** phase = rename drift cleanup complete and verified · last updated = 2026-03-07 15:10 America/New_York · latest relevant commit = canonical docs, cron jobs, and launchagent paths reconciled to `scry-home`

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
- Specialist inheritance refresh: `scripts/tasks/harden_specialists.py` rebuilt to generate upgraded specialist `SOUL.md` / `AGENTS.md` / `CLAUDE.md` baselines plus stronger smoke enforcement.
- Specialist verification: `uv run python -m scripts specialists:harden` ✅ and all six `scripts/specialist-weekly-smoke.sh` runs ✅ at 10/10 across protocol, verification, and attribution.
- Mirror propagation: `cd ~/github/scry-home && uv run python -m scripts sync:openclaw` ✅ copied updated root and `openclaw/` mirror docs.
- Rename drift cleanup: canonical `TOOLS.md`, `MEMORY.md`, specialist mirrored `TOOLS.md`, live cron jobs, repo cron mirror, and the installed OpenClaw backup LaunchAgent now point at `scry-home` instead of `grimoire`.
- Audit verification: `cd ~/github/scry-home && uv run python -m scripts openclaw:audit` ✅ now passes after excluding historical `runs/` from mirror/path checks and skipping stale-path checks for `memory/` history logs.
- Known drift repaired: missing `BOOTSTRAP.md`, missing `BUILD.md`, stale `TOOLS.md` reference to a workspace-local `CONTRIBUTING_TO_OPENCLAW.md`.

### Phase 4 — Propagation
- [x] Run `specialists:harden` to deploy updated templates/hooks/smoke to specialist workspaces
- [x] Run `sync:openclaw` to mirror canonical workspace into `scry-home`
- [x] Run `openclaw:audit` to verify full-stack consistency
- [ ] Consider `cron:reconcile --scope=all --apply` to converge all manifest jobs

### Phase 5 — Audit fix
- [x] Diagnose false-positive path checks in `openclaw:audit`
- [x] Patch trailing-whitespace / markdown-punctuation trimming in path extraction
- [x] Exclude historical `runs/` from mirror/path drift checks and skip stale-path validation for `memory/` history logs
- [x] Re-run `openclaw:audit`

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

### Phase 8 — Specialist bench inheritance refresh
- [x] Rebuild `specialists:harden` so it writes upgraded specialist `SOUL.md`, `AGENTS.md`, and `CLAUDE.md` baselines instead of only hook boilerplate
- [x] Reapply hardening across all active specialists: `codex-orchestrator`, `sentinel`, `scribe`, `research`, `luma`, `operator`
- [x] Fix the generated smoke-script quoting/scoring bug uncovered during verification
- [x] Re-run specialist weekly smokes; all six active specialists now pass 10/10 across protocol, verification, and attribution
- [x] Sync refreshed specialist workspaces back into the `scry-home` mirror

## Immediate next pass priorities

1. If desired, tighten specialist-specific `IDENTITY.md` files beyond the shared verification/attribution anchors.
2. Optionally run `cron:reconcile --scope=all --apply` to converge any manifest drift in managed jobs.
3. Optionally prune any legacy Discord text channels that still exist unbound in the guild UI.
