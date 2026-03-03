# MEMORY.md — Long-Term Memory

> Curated durable facts, preferences, and project state.
> Only loaded in the main private session. Updated as things change.
> Daily context goes in `memory/YYYY-MM-DD.md`. This file is for things that outlive a day.

---

## Stephen — Preferences & Patterns

- Alias: `dunamismax`
- Home: `/Users/sawyer`
- Projects root: `~/github`
- Timezone: America/New_York
- Primary model: `anthropic/claude-opus-4-6` (switched from `openai-codex/gpt-5.3-codex` on 2026-03-02)
- Git identity: commits as `dunamismax`. No AI attribution ever — no "Claude", "Scry", "Co-Authored-By", or agent fingerprints
- Dual remotes: GitHub (`github.com-dunamismax`) + Codeberg (`codeberg.org-dunamismax`), force-push to main
- Communication channel: Signal (primary)
- WhatsApp + BlueBubbles: disabled by Stephen's request (2026-03-02)

## Stack Contract

See `AGENTS.md` for the full stack table. Default is TypeScript + Bun; Python/Rust/Go when genuinely better.

## Active Repos (TypeScript)

All under `~/github`, dual SSH remotes. TypeScript + Bun unless noted:

1. **grimoire** (was scryai-typescript) — Scry's identity/config repo, CLI tools, sync scripts
2. **questlog** (was mylife-rpg) — RPG-style life tracker
3. **podwatch** (was poddashboard) — Podcast dashboard
4. **homepage** (was reactiveweb) — Personal website
5. **sentinel** (was repo-monitor) — Repository monitoring
6. **rip** (was open-video-downloader) — Video download tool
7. **CallRift** — React Native + Expo SIP/VoIP app (zustand for client state)
8. **elchess** — Self-hostable chess platform

## Python Repos (Intentionally Python)

- **augur** (was scry-trader) — Trading system (IBKR + Claude analysis). Python is best-in-class for this ecosystem.
- **oracle** (was mtg-card-bot) — Discord MTG card lookup bot. Python's discord.py is the right tool.

## Other Projects

- **Sawyer-Visual-Media** — Stephen's drone photography/videography business (aerial work). DJI Mini 5 Pro. Keep this repo.

## Archived Repos

- **scryai-swift**, **scryai-gorust**, **elixir**, **espanol** — archived (Phase 2), preserved on GitHub + Codeberg
- **work**, **images** — deleted locally 2026-03-02, still on GitHub + Codeberg

## OpenClaw Setup

- Gateway mode: local, loopback-only, Tailscale allowed
- Signal channel: active, DM allowlist only
- Auth profiles: `openai-codex:default` (OAuth), `anthropic:manual` (token)
- Daily cron at 3am ET syncs workspace → grimoire

### File Sync Model (keep in lockstep)

Two canonical files live in the OpenClaw workspace. Everything else is a copy:

| Canonical (workspace) | Grimoire copies | Other repos |
|---|---|---|
| `SOUL.md` | `SOUL.md` (root) + `openclaw/SOUL.md` | — |
| `AGENTS.md` | `AGENTS.md` (root) + `openclaw/AGENTS.md` | `CLAUDE.md` (points to grimoire) |

- **AGENTS.md = CLAUDE.md content.** Same file, different name. CLAUDE.md in other repos just points to grimoire.
- **Workspace is always canonical.** Edit there, sync outward. Never edit grimoire copies directly.
- **`sync-openclaw` script** copies workspace → grimoire root + `openclaw/` dir. Run with `--commit` to auto-push.
- When SOUL.md or AGENTS.md change, sync immediately — don't let copies drift.

### Signal Channel Config (tuned 2026-03-02)

- Block streaming: **off** (single clean message per response)
- Reasoning visibility: **off** (per-session `/reasoning off`)
- Verbose: **off** (no tool call summaries leaked)
- Human delay: **off** (no artificial latency)
- Typing indicators: **thinking** (shows typing while processing)
- Thinking level: **high** (full extended thinking, hidden from chat)
- Heartbeat reasoning: **false**

## Reference Docs

- **CONTRIBUTING_TO_OPENCLAW.md** — field guide for contributing to OpenClaw. Repo setup, build system, PR template usage, Signal plugin architecture, test patterns, reviewer expectations. Lives in workspace (canonical) and grimoire.

## Open-Source Contributions

- **PR #32217** (2026-03-02): fix — Signal reaction messageId fallback + queued message channelId passthrough. Issue #17651.
- **PR #32396** (2026-03-02): docs — Signal block streaming guide. **CLOSED** — block streaming not recommended for Signal DM use.
- **PR #32397** (2026-03-02): test — Numeric messageId coverage for Signal reaction handler.
- **PR #32398** (2026-03-02): docs — Recommended DM configuration for personal assistant use.
- All authored as `dunamismax`. No Signal subsystem maintainer exists yet — opportunity to establish ownership.

## Decisions Log

- 2026-03-02: Adopted Scry identity (uppercase S). Unified SOUL.md/AGENTS.md across workspace + repo.
- 2026-03-02: Repos get CLAUDE.md pointing to grimoire, not their own SOUL.md/AGENTS.md.
- 2026-03-02: Stripped all `Co-Authored-By: Claude` from 12 repos. No agent attribution, ever.
- 2026-03-02: Completed Phase 1 of repo alignment — all 19 repos have CLAUDE.md + dual SSH remotes.
- 2026-03-02: Adopted "right tool for the job" philosophy — scry-trader stays Python, stack contract is a default not a religion.
- 2026-03-02: CallRift Phase 2 shipped — real SIP engine (sip.js), API client (TanStack Query), server Bun migration, Docker Compose.
- 2026-03-02: Tuned OpenClaw Signal config — disabled block streaming, reasoning, verbose, human delay; enabled typing indicators.
- 2026-03-02: Closed PR #32396 (block streaming guide) — bad advice for Signal DM use case.
