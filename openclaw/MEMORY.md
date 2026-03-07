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
- Primary model: `openai-codex/gpt-5.4` · thinking: high · fallback: `anthropic/claude-opus-4-6`
- Git identity: commits as `dunamismax`. No AI attribution ever — no "Scry", "Co-Authored-By", or agent fingerprints
- Dual remotes: GitHub (`github.com-dunamismax`) + Codeberg (`codeberg.org-dunamismax`), force-push to main
- Machine: M5 MacBook Pro 14" (32GB/1TB, macOS 26.3.1)
- Communication channels: Signal + Discord
- App stack: Notion, GitHub, Codeberg, Docker, VSCode, M365, macOS, Ghostty, RustDesk, Tailscale, Signal, Brave, LocalSend
- Email integration: declined (no Himalaya/Gmail/M365 access)

## Active Repos

All under `~/github`, dual SSH remotes.

**TypeScript + Bun (apps & products):**
1. **grimoire** — Scry's identity/config repo, CLI tools, sync scripts
2. **podwatch** — Podcast dashboard
3. **rip** — Video download tool
4. **CallRift** — React Native + Expo SIP/VoIP app
5. **elchess** — Self-hostable chess platform
6. **pr-firefighter** — Autonomous CI fix pipeline

**Python:**
- **scripts** — Reusable scripts/utilities (`tools/`, `scratch/`, `lib/`). Linting via `ruff`.
- **augur** — Trading system (IBKR + LLM analysis)

**Other:**
- **Sawyer-Visual-Media** — Drone photography/videography business. DJI Mini 5 Pro.
- **dotfiles** — Workstation config backups
- **dunamismax** — GitHub profile README
- **forks/openclaw** — Local fork for contribution work

## OpenClaw Setup

- **Install**: Git-based at `~/openclaw`. Symlink: `~/.openclaw/lib/node_modules/openclaw` → `~/openclaw`. Binary: `~/.local/bin/openclaw` → `~/openclaw/openclaw.mjs`
- **Service**: LaunchAgent, port 18789, loopback-only + Tailscale
- **Auth**: `openai-codex:default` (OAuth), `anthropic:manual` (token)
- **Signal**: DM allowlist, block streaming off, typing on thinking, reasoning hidden
- **Discord**: enabled alongside Signal; Stephen DM allowlist active; guild `1479614326774956167` allowlisted with per-agent channels bound to `main/sentinel/reviewer/builder-mobile/openclaw-maintainer/contributor/luma/codex-orchestrator`; Discord thread bindings enabled for `/focus`, subagent thread spawns, and ACP thread spawns
- **Browser**: Brave, profiles `openclaw` (18800) + `chrome` (18792)
- **ACP**: acpx backend, default **codex**, allows pi/claude/codex/opencode/gemini, 8 concurrent
- **Sub-agents**: depth 2, 8 concurrent, 5 children/agent
- **Web**: Brave search + fetch (50K chars, 30s timeout)
- **Cron**: daily sync (3 AM), daily healthchecks, weekly bench smoke, daily briefing (8:35 AM)

### File Sync Model

Workspace is canonical → synced to grimoire root + `openclaw/` dir via `sync-openclaw` script. CLAUDE.md in other repos points to grimoire. Edit workspace, sync outward.

## Open-Source Contributions

- **PR #32217**: fix — Signal reaction messageId fallback + queued message channelId passthrough
- **PR #32397**: test — Numeric messageId coverage for Signal reaction handler
- **PR #32398**: docs — Recommended DM configuration for personal assistant use
- **PR #38156**: fix — Cron fallback watchdog stays independent from `payload.timeoutSeconds` for isolated cron agent turns (#37505)
- All authored as `dunamismax`. No Signal subsystem maintainer exists yet.

## Decisions (current-state only)

- No AI attribution in git. Ever. Global git hooksPath at `~/.openclaw/git-hooks` enforces this.
- Repos get CLAUDE.md pointing to grimoire, not their own SOUL/AGENTS files.
- PTY spawn is the only valid method for background coding agents. Never ACP runtime (`sessions_spawn runtime:"acp"`) — it silently fails on writes.
- TypeScript for apps/products. Python for all scripting/automation/utilities. Right tool wins.
- Model policy: capability over cost. GPT-5.4 primary (via Codex OAuth), Opus 4.6 fallback. No downgrades. Switched 2026-03-06 after PR #36590 merged.
- Specialist bench: 7 agents (codex-orchestrator, sentinel, reviewer, builder-mobile, openclaw-maintainer, contributor, luma). Codex ⚡ added 2026-03-05 — dispatches Codex CLI (GPT-5.4) instances via `codex exec --full-auto` for parallel programming work. OpenClaw itself now supports GPT-5.4 via Codex OAuth, so this is an orchestration path, not an OAuth workaround.
- Workflow decision (2026-03-06): background Codex/GPT-5.4 coding work routes through `codex-orchestrator`; main and other specialists do not spawn Codex CLI or ACP `agentId:"codex"` directly for repo implementation. Repo specialists own framing; `codex-orchestrator` owns Codex execution, monitoring, and proactive status updates.
- OpenClaw upstream queue policy (2026-03-06): keep `dunamismax` at **<= 10 active PRs** in `openclaw/openclaw`. `contributor` must account for PR headroom during issue triage, and `codex-orchestrator` must prune stale/weak/superseded PRs before launching or opening more when the queue is tight.
- Codex-orchestrator prompt policy (2026-03-06): every spawned Codex CLI lane must be told to use local repo docs first for repo behavior, Context7 first for external/current docs and patterns, and web search only as fallback when Context7 lacks coverage or seems stale.
- Grimoire CLI tools: `specialists:harden` (hook/template rollout), `cron:reconcile` (manifest convergence).
- Grimoire workspace sync now mirrors specialist workspace docs under `grimoire/openclaw/specialists/<agentId>/` for bench backup coverage.
- Cron smoke reconciliation now covers all seven specialists, including codex-orchestrator, contributor, and luma weekly smoke jobs.
- Reference docs (CONTRIBUTING_TO_OPENCLAW.md, issue candidates) live in `grimoire/reference/`, not workspace.
- Communication architecture (2026-03-06): Signal remains active as a parallel channel, but Discord is now configured as the clean multi-agent front door: one dedicated Discord text channel per agent plus thread-bound session support.
- Workspace discipline (2026-03-07): canonical main-workspace docs now explicitly include `BOOTSTRAP.md`; multi-step maintenance passes should keep `BUILD.md` current until handoff.
- Reporting/memory discipline (2026-03-07): non-trivial work reports should lead with outcome → evidence → risks/open questions → next move; durable memory stores only stable preferences/decisions/facts, not transient task sludge.
- Doc drift automation (2026-03-07): `openclaw:audit` CLI command checks workspace doc completeness, mirror consistency, and stale path references. Daily cron job `healthcheck:workspace-doc-drift` runs at 3:40 AM. Daily bench check expanded to require USER.md, TOOLS.md, BOOTSTRAP.md across all agent workspaces.
- Sync/hardening improvements (2026-03-07): `sync_openclaw.py` now mirrors all `.md` files dynamically instead of a fixed list. `harden_specialists.py` now propagates USER.md, TOOLS.md, updated BOOTSTRAP template, and reporting/memory-hygiene rules into specialist workspaces.
