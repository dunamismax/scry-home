# Repo Alignment Tracker

> Unify all `dunamismax` repositories under one consistent standard.
> Every repo gets: CLAUDE.md, clean README, dual SSH remotes.
> TypeScript + Bun + Biome is the default stack. Python (or other languages) stay when they're the right tool.
> Dead stubs get archived.

---

## The Standard

Per `SOUL.md` and `AGENTS.md`, every active code repo must have:

- **Language:** TypeScript (strict mode)
- **Runtime:** Bun (bun.lock, no package-lock.json or yarn.lock)
- **Linting/Formatting:** Biome (no ESLint, no Prettier)
- **Identity docs:** CLAUDE.md pointing to scryai-typescript for SOUL.md + AGENTS.md
- **No AI attribution:** Zero references to Claude/Anthropic/AI in commits, docs, or metadata
- **Dual remotes:** GitHub + Codeberg via SSH host aliases
- **README:** Accurate, current, reflects what the repo actually does

For web apps: React 19+ / React Router 7 (framework mode, SPA-first) / Tailwind 4 / shadcn/ui / TanStack Query / Drizzle + Postgres (if DB) / Better Auth (if auth) / Zod.

For mobile apps: React Native + Expo / TypeScript strict / Biome.

---

## Repo Inventory (current as of Phase 3 completion)

### Active TypeScript Web Apps — Aligned

| Repo | React | Router | Tailwind | shadcn/ui | TanStack Query | DB | Auth | Backend | Status |
|---|---|---|---|---|---|---|---|---|---|
| **mylife-rpg** | 19.2 | 7.13 | 4.2 | yes | yes | Postgres + Drizzle (pg) | none | react-router-serve | lint + typecheck clean |
| **poddashboard** | 19.2 | 7.13 | 4.2 | no | yes | Postgres + Drizzle (pg) | Better Auth | separate Bun backend (concurrently) | lint + typecheck clean |
| **reactiveweb** | 19.2 | 7.13 | 4.2 | yes | yes | Postgres + Drizzle (postgres.js) | Better Auth | Hono | lint + typecheck clean |
| **repo-monitor** | 19.2 | 7.13 | 4.2 | yes | yes | none | none | separate Bun server | lint warnings (a11y), typecheck clean |
| **open-video-downloader** | 19.2 | 7.13 | 4.2 | yes | yes | none | none | Hono (concurrently) | lint + typecheck clean |

All five share: Biome 2.4, Vite 7.3, TypeScript 5.9, Zod 4.3 (except repo-monitor), CLAUDE.md present, dual remotes configured.

### Ops CLI — Aligned

| Repo | Status |
|---|---|
| **scryai-typescript** | Fully aligned. Biome, TypeScript, Bun, CLAUDE.md, dual remotes, OpenClaw sync. |

### Mobile App — Aligned

| Repo | React | Expo SDK | State | Linting | Status |
|---|---|---|---|---|---|
| **CallRift** | 19.2 | 55 | zustand | Biome 2.4 | lint clean (warnings only), typecheck clean |

### Python Repos — Intentionally Remaining Python

| Repo | Stack | Notes |
|---|---|---|
| **mtg-card-bot** | Python 3.12, discord.py, uv | Discord bot — Python ecosystem is ideal |
| **scry-trader** | Python 3.12, ib_async, anthropic SDK, uv | Trading — Python's IBKR/finance ecosystem is best-in-class |

### Chess Platform — Aligned

| Repo | React | Router | Tailwind | Chess | Linting | Status |
|---|---|---|---|---|---|---|
| **elchess** | 19.2 | 7.13 | 4.1 | chess.js 1.0 | Biome 2.4 | lint + typecheck clean |

### Content/Docs Repos — Done

| Repo | Purpose | Status |
|---|---|---|
| **dunamismax** | GitHub profile README | CLAUDE.md added, dual remotes |
| **images** | Asset repo | CLAUDE.md added, dual remotes |
| **Sawyer-Visual-Media** | Business site submodules | CLAUDE.md added, dual remotes |
| **work** | Work desktop sync | CLAUDE.md added, dual remotes |
| **configs** | Dotfile backups (shell scripts, not a code project) | CLAUDE.md added, dual remotes |

### Archived — Deleted Locally, Preserved on GitHub + Codeberg

| Repo | Reason |
|---|---|
| **scryai-swift** | Duplicate of scryai-typescript in Swift |
| **scryai-gorust** | Empty stub (just SOUL.md + CLAUDE.md) |
| **elixir** | Empty stub |
| **espanol** | Tiny Python experiment with different identity |

---

## Phases

### Phase 1: CLAUDE.md + Identity Cleanup ✅

Added CLAUDE.md to all 14 active repos. Removed stale SOUL.md/AGENTS.md/CLAUDE.md from scryai-swift, scryai-gorust, elixir, espanol, scry-trader. Fixed HTTPS→SSH remotes on repos that had them.

### Phase 2: Archive Dead Repos ✅

Deleted local copies of scryai-swift, scryai-gorust, elixir, espanol. All preserved on GitHub + Codeberg.

### Phase 3: Verify Active Web Apps ✅

All five web apps pass `bun run lint` and `bun run typecheck`. Poddashboard had Drizzle migration snapshot formatting fixed. Repo-monitor has a11y warnings (non-blocking).

### Phase 4: Align CallRift (Mobile) ✅

- [x] Upgrade React to 19.2 (Expo SDK 52 → 55, React Native 0.76 → 0.83)
- [x] Replace expo lint (ESLint) with Biome
- [x] Evaluate zustand — all stores are pure client-side UI state, kept zustand (no TanStack Query needed)
- [x] Verify `bun run lint` + `bun run typecheck` clean
- [x] Update README tech stack table

### Phase 5: Bootstrap elchess in TypeScript ✅

- [x] elchess → React Router 7 + Vite + Tailwind 4 + chess.js
- [x] Interactive chess board with click-to-move, legal move highlighting
- [x] Check/checkmate/stalemate/draw detection, move history, captured pieces
- [x] Lint + typecheck clean
- [x] Pushed to GitHub + Codeberg

### Phase 6: Populate MANAGED_PROJECTS ✅

- [x] Add all active repos (8 TypeScript + 2 Python) to `projects.config.ts`
- [x] Verify `bun run scry:projects:doctor` reports all 10 repos present, on main, with dual remotes
- [x] Lint + typecheck clean

---

## Done Criteria

Every repo in `~/github` either:
1. Is TypeScript + Bun + Biome with CLAUDE.md and passing lint/typecheck, OR
2. Is Python (or another language) because it's genuinely the right tool, with CLAUDE.md and clean project setup, OR
3. Is a content/docs repo with CLAUDE.md and a clean README, OR
4. Has been archived and removed.

Zero stale identity docs. Zero wrong-tool-for-the-job compromises. TypeScript is the default; Python (and others) earn their place when the ecosystem demands it.
