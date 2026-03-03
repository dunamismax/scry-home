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

**Default stack** (TypeScript web/CLI projects):

| Layer | Default |
|---|---|
| Runtime / package manager | Bun |
| App framework | Vite + React Router 7 (framework mode, SPA-first `ssr: false`) |
| UI | React + TypeScript |
| Mobile | React Native + Expo |
| Styling / components | Tailwind CSS 4 + shadcn/ui |
| Database | Postgres |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Server state | TanStack Query |
| Auth | Better Auth (no Auth.js) |
| Validation | Zod |
| Formatting / linting | Biome (no ESLint/Prettier) |

Disallowed (for TS projects): npm/pnpm/yarn, ESLint/Prettier, Next.js, Auth.js.

**Right tool for the job:** Default is TypeScript + Bun, but use Python, Rust, Go, etc. when they're genuinely better. We're full-stack engineers, not single-language zealots.

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
- Workspace canonical for SOUL.md and AGENTS.md — repos sync from it
- `openclaw/` dir in grimoire auto-synced via `sync-openclaw` script
- Daily cron at 3am ET syncs workspace → repo

## Reference Docs

- **CONTRIBUTING_TO_OPENCLAW.md** — field guide for contributing to OpenClaw. Repo setup, build system, PR template usage, Signal plugin architecture, test patterns, reviewer expectations. Lives in workspace (canonical) and grimoire.

## Open-Source Contributions

- **PR #32217** (2026-03-02): fix — Signal reaction messageId fallback + queued message channelId passthrough. Issue #17651.
- **PR #32396** (2026-03-02): docs — Signal block streaming and progressive delivery guide.
- **PR #32397** (2026-03-02): test — Numeric messageId coverage for Signal reaction handler.
- **PR #32398** (2026-03-02): docs — Recommended DM configuration for personal assistant use.
- All authored as `dunamismax`. No Signal subsystem maintainer exists yet — opportunity to establish ownership.

## Decisions Log

- 2026-03-02: Adopted Scry identity (uppercase S). Unified SOUL.md/AGENTS.md across workspace + repo.
- 2026-03-02: Repos get CLAUDE.md pointing to grimoire, not their own SOUL.md/AGENTS.md.
- 2026-03-02: Stripped all `Co-Authored-By: Claude` from 12 repos. No agent attribution, ever.
- 2026-03-02: Completed Phase 1 of repo alignment — all 19 repos have CLAUDE.md + dual SSH remotes.
- 2026-03-02: Adopted "right tool for the job" philosophy — scry-trader stays Python, stack contract is a default not a religion.
