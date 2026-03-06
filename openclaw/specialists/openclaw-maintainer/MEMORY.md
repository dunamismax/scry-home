# MEMORY.md - Long-Term Memory

> Curated durable facts, preferences, and project state.
> Only loaded in the main private session. Updated as things change.
> Daily context goes in `memory/YYYY-MM-DD.md`. This file is for things that outlive a day.

---

## Stephen - Preferences & Patterns

- Alias: `dunamismax`
- Home: `/Users/sawyer`
- Projects root: `~/github`
- Timezone: America/New_York
- Primary model: `anthropic/claude-opus-4-6` (set as default again on 2026-03-03; switch manually with `/model codex` when needed)
- Git identity: commits as `dunamismax`. No AI attribution ever - no "Claude", "Scry", "Co-Authored-By", or agent fingerprints
- Dual remotes: GitHub (`github.com-dunamismax`) + Codeberg (`codeberg.org-dunamismax`), force-push to main
- Communication channel: Signal (primary)
- WhatsApp + BlueBubbles: disabled by Stephen's request (2026-03-02)

## Stack Contract

See `AGENTS.md` for the full stack table. Default is TypeScript + Bun; Python/Rust/Go when genuinely better.

## Active Repos (TypeScript)

All under `~/github`, dual SSH remotes. TypeScript + Bun unless noted:

1. **grimoire** (was scryai-typescript) - Scry's identity/config repo, CLI tools, sync scripts
2. **podwatch** (was poddashboard) - Podcast dashboard
3. **rip** (was open-video-downloader) - Video download tool
4. **CallRift** - React Native + Expo SIP/VoIP app (zustand for client state)
5. **elchess** - Self-hostable chess platform
6. **pr-firefighter** - Autonomous CI fix pipeline

## Python Repos (Intentionally Python)

- **augur** (was scry-trader) - Trading system (IBKR + LLM analysis). Python is best-in-class for this ecosystem.

## Other Projects

- **Sawyer-Visual-Media** - Stephen's drone photography/videography business (aerial work). DJI Mini 5 Pro. Keep this repo.

## Archived / Removed Repos

- **scryai-swift**, **scryai-gorust**, **elixir**, **espanol** - archived (Phase 2), preserved on GitHub + Codeberg
- **work**, **images** - deleted locally 2026-03-02, still on GitHub + Codeberg
- **questlog**, **homepage**, **sentinel**, **oracle** - deleted locally 2026-03-03 by Stephen. May still exist on remotes.

## OpenClaw Setup

- **Install**: Git-based at `~/openclaw` (no npm install). `~/.openclaw/lib/node_modules/openclaw` symlinks to git repo. Update via `git pull` + restart.
- **Binary**: `~/.local/bin/openclaw` → `~/openclaw/openclaw.mjs`
- **Service**: LaunchAgent, port 18789
- Gateway mode: local, loopback-only, Tailscale allowed
- Signal channel: active, DM allowlist only
- Auth profiles: `openai-codex:default` (OAuth), `anthropic:default` (OAuth)
- Daily cron at 3am ET syncs workspace → grimoire
- **Browser**: Brave configured, profiles `openclaw` (18800) + `chrome` (18792)
- **ACP**: enabled, acpx backend, default **claude** (Claude Code), allows pi/claude/codex/opencode/gemini, 8 concurrent
- **Sub-agents**: depth 2, 8 concurrent, 5 children/agent
- **Web**: search (Brave, needs API key), fetch (50K chars, 30s timeout)

### File Sync Model (keep in lockstep)

Two canonical files live in the OpenClaw workspace. Everything else is a copy:

| Canonical (workspace) | Grimoire copies | Other repos |
|---|---|---|
| `SOUL.md` | `SOUL.md` (root) + `openclaw/SOUL.md` | - |
| `AGENTS.md` | `AGENTS.md` (root) + `openclaw/AGENTS.md` | `CLAUDE.md` (points to grimoire) |

- **AGENTS.md = CLAUDE.md content.** Same file, different name. CLAUDE.md in other repos just points to grimoire.
- **Workspace is always canonical.** Edit there, sync outward. Never edit grimoire copies directly.
- **`sync-openclaw` script** copies workspace → grimoire root + `openclaw/` dir. Run with `--commit` to auto-push.
- When SOUL.md or AGENTS.md change, sync immediately - don't let copies drift.

### Signal Channel Config (tuned 2026-03-02)

- Block streaming: **off** (single clean message per response)
- Reasoning visibility: **off** (per-session `/reasoning off`)
- Verbose: **off** (no tool call summaries leaked)
- Human delay: **off** (no artificial latency)
- Typing indicators: **thinking** (shows typing while processing)
- Thinking level: **high** (full extended thinking, hidden from chat)
- Heartbeat reasoning: **false**

## Reference Docs

- **CONTRIBUTING_TO_OPENCLAW.md** - field guide for contributing to OpenClaw. Repo setup, build system, PR template usage, Signal plugin architecture, test patterns, reviewer expectations. Lives in workspace (canonical) and grimoire.

## Open-Source Contributions

- **PR #32217** (2026-03-02): fix - Signal reaction messageId fallback + queued message channelId passthrough. Issue #17651.
- **PR #32396** (2026-03-02): docs - Signal block streaming guide. **CLOSED** - block streaming not recommended for Signal DM use.
- **PR #32397** (2026-03-02): test - Numeric messageId coverage for Signal reaction handler.
- **PR #32398** (2026-03-02): docs - Recommended DM configuration for personal assistant use.
- All authored as `dunamismax`. No Signal subsystem maintainer exists yet - opportunity to establish ownership.

## Workflow Preferences

- **Multi-agent orchestration:** Stephen loves it. When work is parallelizable, fan out Codex/ACP coding agents - one per repo/task, focused prompts, push-based completion via `openclaw system event`. Scry orchestrates, agents execute. Don't serialize what can be parallelized.
- **Project tracking:** For longer-running builds/features, maintain a root `BUILD.md` in each repo and keep it continuously accurate (phase status, checklist progress, verification snapshot, and next-pass priorities).
- **Background-first workflow:** Stephen strongly prefers background agents for implementation while keeping the main chat thread continuously available for coordination, updates, and parallel work across repos.
- **PTY spawn only — never ACP runtime for coding agents:** ACP runtime (`sessions_spawn runtime:"acp"`) silently fails on all writes (`ACP_TURN_FAILED`, exit code 5). Always use PTY exec: `exec pty:true background:true command:'claude -p "..." --dangerously-skip-permissions'` with `openclaw system event` for push-based completion. This is permanent.
- **Max-capability posture:** Stephen wants OpenClaw/Scry configured for maximum practical leverage via strong integrations, automation, and orchestration across his tool stack, with explicit tradeoff/consent handling for risky enables.
## Decisions Log

- 2026-03-02: Adopted Scry identity (uppercase S). Unified SOUL.md/AGENTS.md across workspace + repo.
- 2026-03-02: Repos get CLAUDE.md pointing to grimoire, not their own SOUL.md/AGENTS.md.
- 2026-03-02: Stripped all `Co-Authored-By: Claude` from 12 repos. No agent attribution, ever.
- 2026-03-02: Completed Phase 1 of repo alignment - all 19 repos have CLAUDE.md + dual SSH remotes.
- 2026-03-02: Adopted "right tool for the job" philosophy - scry-trader stays Python, stack contract is a default not a religion.
- 2026-03-02: CallRift Phase 2 shipped - real SIP engine (sip.js), API client (TanStack Query), server Bun migration, Docker Compose.
- 2026-03-02: Tuned OpenClaw Signal config - disabled block streaming, reasoning, verbose, human delay; enabled typing indicators.
- 2026-03-02: Closed PR #32396 (block streaming guide) - bad advice for Signal DM use case.
- 2026-03-03: Switched back to Codex as default model for OpenClaw/Scry due Anthropic reliability issues.
- 2026-03-03: Configured dual OAuth model switching (`/model claude` and `/model codex`) with Codex retained as default.
- 2026-03-03: Set Claude Opus back to the global default by request; keep `/model codex` available for manual override.
- 2026-03-03: Standardized BUILD.md project ledgers for long-running work; keep root BUILD.md in active repos and update it alongside implementation progress.
- 2026-03-03: Reaffirmed background-agent-first workflow as preferred mode: run coding agents in background, keep main thread responsive for orchestration and concurrent work.
- 2026-03-03: Adopted explicit max-capability integration posture: prioritize durable OpenClaw integrations/automation across Stephen's stack, with clear risk/consent gates for high-impact enables.
- 2026-03-03: Nuked npm OpenClaw install, symlinked `~/.openclaw/lib/node_modules/openclaw` → `~/openclaw` git repo. Git-only install going forward.
- 2026-03-03: Enabled browser (Brave), ACP coding agents (acpx/codex), nested sub-agents (depth 2), web fetch. Created CAPABILITY-GUIDE.md.
- 2026-03-03: Stephen's app stack: Notion, GitHub, Codeberg, Docker, VSCode, M365, macOS, Ghostty, RustDesk, Tailscale, Signal, Brave, LocalSend.
- 2026-03-03: Stephen declined email integration (Himalaya/Gmail/M365). Removed config + keychain entries. No email access.
- 2026-03-03: Notion "Scry" integration connected to "Stephen's Notion" workspace. Brave Search API key configured. Peekaboo, summarize, tmux, whisper, clawhub all installed.
- 2026-03-03: Skills ready: 15/52 (up from 8). New: acp-router, clawhub, peekaboo, summarize, tmux, whisper, himalaya (installed but unused).
- 2026-03-03: Peekaboo CLI uninstalled by request; local Peekaboo automation is disabled unless reinstalled.
- 2026-03-03: Added explicit specialist-bench stewardship rules to Scry’s AGENTS/SOUL and validated delegation wiring with Sentinel/Reviewer smoke runs (Opus attempts failed transiently, Codex fallback smoke runs succeeded).
- 2026-03-03: Added daily cron maintenance: `healthcheck:agent-bench-daily` (agent/workspace/model integrity) and `healthcheck:docs-sync-daily` (SOUL/AGENTS canonical sync + drift auto-commit), both verified with manual runs.
- 2026-03-03: Repaired `optimization:weekly-agent-bench-review` cron (previous run timed out on both Codex and Opus) by tightening prompt scope, lowering thinking, and switching to Opus primary; forced validation run succeeded and delivered.
- 2026-03-03: Set explicit model policy: prioritize capability over cost; keep all agents on top-tier pool only (`anthropic/claude-opus-4-6` and `openai-codex/gpt-5.3-codex`) unless Stephen explicitly overrides.
- 2026-03-03: Implemented all 5 weekly specialist-bench improvements in parallel (verification gates, handoff protocols, scope boundaries, role-specific CLAUDE docs, weekly smoke-check automation) and added `healthcheck:agent-bench-weekly-smoke` (Mon 09:20 ET).
- 2026-03-03: **PTY spawn is the only valid method for background coding agents.** ACP runtime (`sessions_spawn runtime:"acp"`) fails silently on all writes (exit code 5, `--non-interactive-permissions fail`). Always use `exec pty:true background:true` with `claude -p --dangerously-skip-permissions`. Permanent decision.
- 2026-03-03: **Full code review completed across all 7 active repos** (augur, CallRift, elchess, grimoire, podwatch, rip, Sawyer-Visual-Media). Two passes: deep pass (P0/P1 security + architecture fixes) then final polish (42 UX/DX items). All committed and pushed to both remotes. Master tracker removed.
- 2026-03-04: OpenClaw Maintainer Phase 2 completed: installed external git hooks (`commit-msg`, `pre-push`) via repo-local `core.hooksPath` to enforce no assistant/AI attribution in commit metadata; added manual audit script and scored weekly smoke script (triage/verification/attribution).
- 2026-03-04: Specialist hardening generator now exists in grimoire (`bun run scry:specialists:harden`) for shared rollout to general specialist agents; `openclaw-maintainer` remains a custom profile with dedicated runbook/audit/smoke scripts.
