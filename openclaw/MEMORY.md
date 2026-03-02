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

| Layer | Tool |
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

Disallowed: npm/pnpm/yarn, ESLint/Prettier, Next.js, Auth.js.

## Active Repos (TypeScript)

All under `~/github`, all Bun + TypeScript, dual SSH remotes:

1. **scryai-typescript** — Scry's identity/config repo, CLI tools, sync scripts
2. **mylife-rpg** — RPG-style life tracker
3. **poddashboard** — Podcast dashboard
4. **reactiveweb** — Personal website
5. **repo-monitor** — Repository monitoring
6. **open-video-downloader** — Video download tool
7. **CallRift** — React Native + Expo SIP/VoIP app (zustand for client state)
8. **scry-trader** — Trading system (IBKR + Claude analysis) — marked for TS rewrite from Python
9. **elchess** — Self-hostable chess platform — marked for TS bootstrap

## Archived / Non-TS Repos

- **scryai-swift**, **scryai-gorust**, **elixir**, **espanol** — marked for archive (Phase 2)
- **mtg-card-bot** — intentionally remaining Python, not tracked in MANAGED_PROJECTS

## OpenClaw Setup

- Gateway mode: local, loopback-only, Tailscale allowed
- Signal channel: active, DM allowlist only
- Auth profiles: `openai-codex:default` (OAuth), `anthropic:manual` (token)
- Workspace canonical for SOUL.md and AGENTS.md — repos sync from it
- `openclaw/` dir in scryai-typescript auto-synced via `sync-openclaw` script
- Daily cron at 3am ET syncs workspace → repo

## Decisions Log

- 2026-03-02: Adopted Scry identity (uppercase S). Unified SOUL.md/AGENTS.md across workspace + repo.
- 2026-03-02: Repos get CLAUDE.md pointing to scryai-typescript, not their own SOUL.md/AGENTS.md.
- 2026-03-02: Stripped all `Co-Authored-By: Claude` from 12 repos. No agent attribution, ever.
- 2026-03-02: Completed Phase 1 of repo alignment — all 19 repos have CLAUDE.md + dual SSH remotes.
