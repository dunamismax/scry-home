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

All primary repos under `~/github` are cloned locally and use dual SSH remotes with GitHub + Codeberg push URLs.

**Current local inventory (2026-03-07):**
- `CallRift`
- `Sawyer-Visual-Media`
- `boring-go-web`
- `c-from-the-ground-up`
- `dunamismax`
- `elchess`
- `hello-world-from-hell`
- `imaging-services-ops`
- `openclaw`
- `podwatch`
- `pr-firefighter`
- `pyforge`
- `questlog`
- `rip`
- `scry-home`
- `scryfall-discord-bot`
- `trade-desk-cli`

**Known repo roles / notes:**
- `scry-home` — Scry identity/config repo, CLI tools, sync scripts (renamed from `grimoire`)
- `pyforge` — reusable Python scripts/utilities, automation, and tooling (renamed from `scripts`)
- `trade-desk-cli` — trading system (IBKR + LLM analysis; renamed from `augur`)
- `scryfall-discord-bot` — Discord MTG card lookup bot (renamed from `oracle`)
- `boring-go-web` — Go web/server repo (renamed from `go-web-server`)
- `imaging-services-ops` — consolidated imaging-services repo/workflow (renamed from `imagingservices`)
- `podwatch` — podcast dashboard
- `rip` — video download tool
- `CallRift` — React Native + Expo SIP/VoIP app
- `elchess` — self-hostable chess platform
- `pr-firefighter` — autonomous CI fix pipeline
- `Sawyer-Visual-Media` — drone photography/videography business; DJI Mini 5 Pro
- `dunamismax` — GitHub profile README

**OpenClaw local layout:**
- `~/github/openclaw` — primary local repo clone
- `~/openclaw` — live install checkout used by the running system
- `~/github/forks/openclaw` — contribution fork/worktree source

## OpenClaw Setup

- **Install**: Git-based at `~/openclaw`. Symlink: `~/.openclaw/lib/node_modules/openclaw` → `~/openclaw`. Binary: `~/.local/bin/openclaw` → `~/openclaw/openclaw.mjs`
- **Service**: LaunchAgent, port 18789, loopback-only + Tailscale
- **Auth**: `openai-codex:default` (OAuth), `anthropic:manual` (token)
- **Signal**: DM allowlist, block streaming off, typing on thinking, reasoning hidden
- **Discord**: enabled alongside Signal; Stephen DM allowlist active; guild `1479614326774956167` allowlisted with per-agent channels bound to `main/codex-orchestrator/scribe/research/sentinel/luma/operator`; Discord thread bindings enabled for `/focus`, subagent thread spawns, and ACP thread spawns
- **Browser**: Brave, profiles `openclaw` (18800) + `chrome` (18792)
- **ACP**: acpx backend, default **codex**, allows pi/claude/codex/opencode/gemini, 8 concurrent
- **Sub-agents**: depth 2, 8 concurrent, 5 children/agent
- **Web**: Brave search + fetch (50K chars, 30s timeout)
- **Cron**: daily sync (3 AM), daily healthchecks, weekly bench smoke, daily briefing (8:35 AM)

### File Sync Model

Workspace is canonical → synced to `scry-home` root + `openclaw/` dir via `sync-openclaw` script. CLAUDE.md in other repos points to `scry-home`. Edit workspace, sync outward.

## Open-Source Contributions

- **PR #32217**: fix — Signal reaction messageId fallback + queued message channelId passthrough
- **PR #32397**: test — Numeric messageId coverage for Signal reaction handler
- **PR #32398**: docs — Recommended DM configuration for personal assistant use
- **PR #38156**: fix — Cron fallback watchdog stays independent from `payload.timeoutSeconds` for isolated cron agent turns (#37505)
- All authored as `dunamismax`. No Signal subsystem maintainer exists yet.

## Decisions (current-state only)

- No AI attribution in git. Ever. Global git hooksPath at `~/.openclaw/git-hooks` enforces this.
- Repos get CLAUDE.md pointing to `scry-home`, not their own SOUL/AGENTS files.
- PTY spawn is the only valid method for background coding agents. Never ACP runtime (`sessions_spawn runtime:"acp"`) — it silently fails on writes.
- TypeScript for apps/products. Python for all scripting/automation/utilities. Right tool wins.
- Model policy: capability over cost. GPT-5.4 primary (via Codex OAuth), Opus 4.6 fallback. No downgrades. Switched 2026-03-06 after PR #36590 merged.
- Specialist bench: 6 agents (codex-orchestrator, sentinel, scribe, research, luma, operator). Roster refactored 2026-03-07: retired reviewer/builder-mobile/openclaw-maintainer/contributor; added scribe (writing/comms), research (deep research/synthesis), operator (infra/automation/systems). Codex ⚡ dispatches Codex CLI (GPT-5.4) instances for parallel programming work.
- Workflow decision (2026-03-06): background Codex/GPT-5.4 coding work routes through `codex-orchestrator`; main and other specialists do not spawn Codex CLI or ACP `agentId:"codex"` directly for repo implementation. Repo specialists own framing; `codex-orchestrator` owns Codex execution, monitoring, and proactive status updates.
- OpenClaw upstream queue policy (2026-03-06): keep `dunamismax` at **<= 10 active PRs** in `openclaw/openclaw`. `codex-orchestrator` must prune stale/weak/superseded PRs before launching or opening more when the queue is tight.
- Codex-orchestrator prompt policy (2026-03-06): every spawned Codex CLI lane must be told to use local repo docs first for repo behavior, Context7 first for external/current docs and patterns, and web search only as fallback when Context7 lacks coverage or seems stale.
- Grimoire CLI tools: `specialists:harden` (hook/template rollout), `cron:reconcile` (manifest convergence).
- `scry-home` workspace sync now mirrors specialist workspace docs under `scry-home/openclaw/specialists/<agentId>/` for bench backup coverage.
- Cron smoke reconciliation covers all six specialists: codex-orchestrator, sentinel, scribe, research, luma, operator.
- Reference docs (CONTRIBUTING_TO_OPENCLAW.md, issue candidates) live in `scry-home/reference/`, not workspace.
- Communication architecture (2026-03-06): Signal remains active as a parallel channel, but Discord is now configured as the clean multi-agent front door: one dedicated Discord text channel per agent plus thread-bound session support.
- Workspace discipline (2026-03-07): canonical main-workspace docs now explicitly include `BOOTSTRAP.md`; multi-step maintenance passes should keep `BUILD.md` current until handoff.
- Reporting/memory discipline (2026-03-07): non-trivial work reports should lead with outcome → evidence → risks/open questions → next move; durable memory stores only stable preferences/decisions/facts, not transient task sludge.
- Doc drift automation (2026-03-07): `openclaw:audit` CLI command checks workspace doc completeness, mirror consistency, and stale path references. Daily cron job `healthcheck:workspace-doc-drift` runs at 3:40 AM. Daily bench check expanded to require USER.md, TOOLS.md, BOOTSTRAP.md across all agent workspaces.
- Sync/hardening improvements (2026-03-07): `sync_openclaw.py` now mirrors all `.md` files dynamically instead of a fixed list. `harden_specialists.py` now propagates USER.md, TOOLS.md, updated BOOTSTRAP template, and reporting/memory-hygiene rules into specialist workspaces.
- Repo rename (2026-03-07): the old `grimoire` repo is now `scry-home` at `~/github/scry-home`; current docs, cron jobs, and operational paths should use `scry-home`.
- Memory search fix (2026-03-07): local memory indexing now uses Ollama embeddings with `nomic-embed-text` plus a local placeholder API key (`ollama-local`). Codex OAuth does not satisfy memory embeddings.
- Discord trust posture (2026-03-07): the Discord deployment is a private single-user server for Stephen only. `openclaw status` may still emit a generic multi-user warning because the heuristic only sees allowlisted group targets.
- Discord architecture decision (2026-03-07, revised later that night): durable Discord organization now uses **one home channel per agent and task-specific threads underneath those home channels**. The old `Workspaces` category and its scoped channels were retired; OpenClaw Discord bindings/allowlists now target only the seven home channels, with thread bindings handling task branches.
- Prompt-storage decision (2026-03-07, revised later that night): reusable raw prompts live under `~/.openclaw/workspace/prompts/` and are mirrored into `scry-home/openclaw/prompts/`. The prompt pack is now organized **per agent** and written for **thread-first Discord use** rather than workspace-channel modes. Do not pursue a custom shared-skills rollout for this workflow right now.
- OpenClaw backup posture (2026-03-07): `scry-home` now carries an encrypted off-machine backup of high-value OpenClaw runtime state, not just docs/config. Current encrypted scope includes `.openclaw/agents`, `.openclaw/memory`, `.openclaw/subagents`, `.openclaw/cron`, and `.openclaw/delivery-queue` in addition to the prior critical-config set.
- Backup architecture note (2026-03-07): the current encrypted OpenClaw runtime artifact is large (~96 MB) and successfully pushes to private GitHub + Codeberg, but long-term the cleaner destination for rotating runtime blobs is a dedicated backup target (restic/B2/S3/NAS) rather than normal git history.
