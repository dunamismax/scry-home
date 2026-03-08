# BUILD.md

**Current status:** phase = Discord workspaces retired + thread-first prompt-library rebuild done · last updated = 2026-03-07 21:16 America/New_York · latest relevant focus = live Discord config now targets only the seven agent home channels and the canonical prompt pack has been reorganized into per-agent thread-first folders, mirrored into specialist workspaces and `scry-home`

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

### Phase 9 — 2026-03-07 runtime/workspace audit
- [x] Re-check live `openclaw status`
- [x] Re-run `openclaw:audit` to identify mirror/path drift
- [x] Identify stale context sources and dead paths in workspace docs/templates
- [x] Remove the stale `CallRift` prompt from `workspace/prompts`
- [x] Repair the codex-orchestrator repo-review output path
- [x] Rewrite stale Sentinel durable memory to current reality
- [x] Sync workspace/specialist changes back into `scry-home`
- [x] Re-run `openclaw:audit` after sync to confirm the remaining drift is gone

### Audit snapshot — 2026-03-07 16:58 ET
- `openclaw status` shows the gateway healthy on 2026.3.3 with 7 active agents and 8 active sessions.
- Security audit is clean of criticals, but still warns about (1) untrusted reverse-proxy headers if the Control UI is ever proxied and (2) the personal-assistant runtime being reachable by multiple users if Discord group access is treated as shared/untrusted.
- `openclaw:audit` found real drift before cleanup: unsynced root/mirror markdown, a stale CallRift repo path in an old workspace prompt, and a dead repo-review output directory in the codex-orchestrator template.
- Sentinel's old `MEMORY.md` was materially stale: wrong default model, old Signal-only comms posture, old repo inventory, and outdated reference-doc location.
- Inactive legacy specialist workspaces from the old Claude/Codex era were removed. Codex-orchestrator run artifacts were trimmed to the current useful set.
- Memory search anomaly was root-caused and fixed: without an embedding provider, OpenClaw intentionally skipped file/session sync entirely in FTS-only mode. Local Ollama embeddings (`nomic-embed-text`) are now configured and the index was rebuilt successfully.
- `openclaw status` now reports populated memory (`11 files · 39 chunks`) and `openclaw memory status --deep` shows ready vector + FTS indexing across all active agents.

### Phase 10 — Discord infrastructure cutover
- [x] Audit the live Discord server layout and existing thread sprawl
- [x] Decide on durable channel-based architecture instead of permanent-thread sprawl
- [x] Create `Agents` and `Workspaces` categories plus durable workspace channels
- [x] Rebind all new workspace channels in OpenClaw config and restart cleanly
- [x] Delete the obsolete seeded threads so only the new architecture remains
- [x] Verify gateway health plus zero remaining threads under the agent home channels

### Discord cutover snapshot — 2026-03-07 18:58 ET
- Durable structure is now **channels for homes/workspaces, threads only for short-lived branches**.
- `Agents` now holds the seven home channels: `scry`, `codex`, `research`, `scribe`, `operator`, `sentinel`, `luma`.
- `Workspaces` now holds the durable scoped lanes: `codex-lab`, `codex-shipyard`, `codex-review-desk`, `codex-bug-hunt`, `research-market-radar`, `research-deep-dive`, `research-kill-or-pursue`, `scribe-draft-room`, `scribe-docs-distillery`, `operator-ops-watch`, `operator-openclaw-ops`, `operator-automation-yard`, `sentinel-security-audit`, `luma-shot-lab`.
- OpenClaw config was patched so every new workspace channel is explicitly allowlisted and bound to the correct agent.
- Verification: `openclaw status` stayed healthy after restart, and Discord `thread-list` now returns zero threads under `#scry`, `#codex`, `#research`, `#scribe`, `#operator`, `#sentinel`, and `#luma`.

### Phase 11 — OpenClaw runtime backup hardening
- [x] Audit what `scry-home` sync covers versus what live `~/.openclaw` state it misses
- [x] Identify and fix the live backup-runner failure after repo/tooling drift
- [x] Expand encrypted backup scope to include high-value OpenClaw runtime state (`agents`, `memory`, `subagents`, `cron`, `delivery-queue`)
- [x] Generate and verify a fresh encrypted runtime-inclusive artifact
- [x] Reload the LaunchAgent and verify scheduled backup health (`last exit code = 0`)
- [x] Push the repaired backup flow + fresh encrypted artifact off-machine through private GitHub + Codeberg remotes

### Backup hardening snapshot — 2026-03-07 19:12 ET
- `scry-home` backup automation now captures the important OpenClaw working-brain state, not just mirrored docs/config.
- The live runner failure was repaired by fixing launchd-safe path handling and explicit repo CLI invocation from the backup script.
- Fresh encrypted artifact created at `~/github/scry-home/vault/config/critical-configs.tar.enc` with restore verification passing against session + memory requirements.
- `launchctl print gui/$(id -u)/com.scry.openclaw.backup` now reports `last exit code = 0` after reload.
- Off-machine publication succeeded to both private remotes; current artifact size is ~96 MB, so future migration to a dedicated blob backup target is still the cleaner long-term path.

### Phase 12 — Discord workspaces vs custom skills rollback
- [x] Restore Discord workspace channel bindings/allowlist after the temporary home-only cutover
- [x] Confirm no workspace channels were deleted during the reversal
- [x] Remove the custom shared skills that were created during the experiment
- [x] Keep the reusable OpenClaw bug prompt as markdown under `workspace/prompts/`
- [x] Revert workspace/sync-memory drift that implied a shared-skills rollout was the new default

### Rollback snapshot — 2026-03-07 19:59 ET
- The Discord server remains on the channel-plus-workspaces architecture; no workspace channels were deleted.
- The temporary config cutover to home-channels-only was reverted and full workspace bindings were restored.
- Custom shared skills created during the experiment were removed.
- Historical note: at that point the OpenClaw mergeable bug scout prompt still existed as a standalone markdown file in the old flat prompt layout.

### Phase 13 — Prompt library expansion for the Discord bench
- [x] Audit the current prompt directory and existing reusable prompt style
- [x] Review the active specialist bench and mirrored specialist files
- [x] Review the live Discord agent/workspace channel layout and lane topics
- [x] Draft a broader reusable prompt pack aligned to the current lanes
- [x] Add a prompt index so future routing is obvious
- [x] Sync the updated prompt library into `scry-home`
- [x] Run repo verification relevant to the mirrored prompt changes
- [x] Commit the prompt-library expansion cleanly

### Prompt library snapshot — 2026-03-07 20:24 ET
- The prompt library now mirrors the current Discord architecture instead of carrying only a single bug-hunt prompt.
- New reusable prompts were added for orchestration, Codex ship/lab/review flows, Research deep-dive/market/decision work, Scribe drafting/docs distillation, Operator OpenClaw ops/automation/incidents, Sentinel security audits, and Luma creative treatment work.
- `README.md` now acts as a quick index for future prompt selection.
- `uv run python -m scripts sync:openclaw` ✅ propagated the new prompt pack into `~/github/scry-home/openclaw/prompts/openclaw/`.
- `bun run lint` ✅ passed in `~/github/scry-home`.
- `uv run python -m scripts openclaw:audit` ✅ passed after creating the intended local worktree root at `~/.openclaw/worktrees`, which existing codex-orchestrator docs already referenced.
- Local repo commits were created in `~/github/scry-home` for the prompt-library expansion; the working tree still contains unrelated pre-existing mirror noise outside this task.

### Phase 14 — Specialist prompt locality + bootstrap ceiling
- [x] Add a durable local mirror of shared OpenClaw prompt files inside specialist workspaces so file reads stay within sandbox roots
- [x] Teach specialist baselines to prefer local prompt mirrors instead of the `scry-home` export path
- [x] Trim canonical `AGENTS.md` below the injected-context ceiling and verify the new size
- [x] Re-run hardening/sync verification after the fixes

### Follow-up snapshot — 2026-03-07 20:56 ET
- Canonical `AGENTS.md` is now `19,943` bytes, below the 20,000-byte injected bootstrap ceiling that previously caused truncation.
- `scripts/tasks/harden_specialists.py` now mirrors the shared `workspace/prompts/openclaw/` pack into each specialist workspace at `prompts/openclaw/` and adds an explicit local-path rule to specialist `CLAUDE.md` hardening guidance.
- `uv run python -m scripts specialists:harden` ✅ applied the prompt-locality baseline across all six active specialists; a targeted rerun for `codex-orchestrator` restored its issue-lane-specific overlays after the generic pass.
- Historical note: at that point the live codex-orchestrator workspace still carried the old standalone mergeable-bug prompt plus the related shared prompt pack locally.
- `uv run python -m scripts sync:openclaw` ✅ mirrored the updated canonical + specialist files back into `~/github/scry-home`.
- `uv run python -m scripts openclaw:audit` ✅ passed after the final sync.

### Phase 15 — Discord workspaces retirement + thread-first prompt rebuild
- [x] Remove dead Discord workspace bindings from live OpenClaw config so only the seven home channels remain allowlisted/bound
- [x] Retire the Discord `Workspaces` category and its scoped channels (user completed the server-side deletion directly)
- [x] Reorganize the canonical prompt pack into per-agent folders for thread-first use
- [x] Sync the rebuilt prompt pack into `scry-home`
- [x] Run prompt/config verification after the Discord cleanup
- [x] Commit the canonical workspace changes and the mirrored `scry-home` changes cleanly

### Phase 15 snapshot — 2026-03-07 21:10 ET
- The old `Workspaces` category and its scoped Discord channels are now gone from the server; Stephen deleted the server-side channels directly.
- Live OpenClaw config has been cleaned so `bindings` target only `#scry`, `#codex`, `#research`, `#scribe`, `#operator`, `#sentinel`, and `#luma`, and the Discord guild allowlist now contains only those seven home-channel IDs.
- The canonical prompt pack under `workspace/prompts/openclaw/` has been rebuilt into per-agent folders (`scry/`, `codex/`, `research/`, `scribe/`, `operator/`, `sentinel/`, `luma/`) with thread-first starter prompts.
- This phase supersedes the earlier channel-plus-workspaces experiment documented above.

## Immediate next pass priorities

1. If desired, move rotating encrypted runtime backup blobs out of normal git history and onto a dedicated backup target (restic/B2/S3/NAS) while keeping `scry-home` as the control plane/manifest.
2. If desired, tighten specialist-specific `IDENTITY.md` files beyond the shared verification/attribution anchors.
3. Optionally run `cron:reconcile --scope=all --apply` to converge any manifest drift in managed jobs.
