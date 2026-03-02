# Repo Alignment Tracker

> Track the work to unify all `dunamismax` repositories under one consistent standard.
> Every repo gets: TypeScript + Bun, unified identity docs, Biome, clean README, dual remotes.
> Non-TS repos either get rewritten in TypeScript or archived.

---

## The Standard

Per `SOUL.md` and `AGENTS.md`, every active repo must:

- [ ] **Language:** TypeScript (strict mode)
- [ ] **Runtime:** Bun (bun.lock, no package-lock.json or yarn.lock)
- [ ] **Linting/Formatting:** Biome (no ESLint, no Prettier)
- [ ] **Identity docs:** CLAUDE.md pointing to SOUL.md + AGENTS.md (code agent bootstrap)
- [ ] **No AI attribution:** Zero references to Claude/Anthropic/AI in commits, docs, or metadata
- [ ] **Dual remotes:** GitHub + Codeberg via host aliases
- [ ] **README:** Accurate, current, reflects what the repo actually does
- [ ] **Git hygiene:** Clean history, main branch, atomic commits

For web apps specifically:
- [ ] React 19+ / React Router (framework mode, SPA-first)
- [ ] Tailwind CSS + shadcn/ui
- [ ] TanStack Query (server state)
- [ ] Drizzle ORM + Postgres (if DB needed)
- [ ] Better Auth (if auth needed, no Auth.js)
- [ ] Zod (validation)

For mobile apps:
- [ ] React Native + Expo
- [ ] TypeScript strict
- [ ] Biome (replacing expo lint/eslint)

---

## Current State by Repo

### Tier 1 — Active TypeScript Apps (need alignment fixes)

| Repo | Biome | CLAUDE.md | React 19 | TanStack Query | shadcn/ui | Bun Lock | Deviations |
|---|---|---|---|---|---|---|---|
| **mylife-rpg** | yes | MISSING | 19.2 | yes | yes | yes | No CLAUDE.md |
| **poddashboard** | yes | MISSING | 19.2 | yes | no | yes | No CLAUDE.md, no shadcn/ui |
| **reactiveweb** | yes | MISSING | 19.2 | yes | yes | yes | No CLAUDE.md |
| **repo-monitor** | yes | MISSING | 19.2 | yes | yes | yes | No CLAUDE.md, no backend/DB yet |
| **open-video-downloader** | yes | MISSING | 19.2 | yes | yes | yes | No CLAUDE.md |
| **scryai-typescript** | yes | yes | n/a (CLI) | n/a | n/a | yes | Aligned |

### Tier 2 — Mobile App (needs stack alignment)

| Repo | Deviations |
|---|---|
| **CallRift** | React 18.3 (needs 19+), no Biome (uses expo lint/eslint), no CLAUDE.md, zustand instead of TanStack Query, Expo SDK 52 (check latest), no Tailwind/NativeWind, babel.config.js still present |

### Tier 3 — Non-TypeScript (need full rewrite or archive)

| Repo | Current Lang | Decision | Notes |
|---|---|---|---|
| **scry-trader** | Python (uv) | **REWRITE** | Trading bot with IBKR + Claude. Rewrite in TypeScript + Bun. |
| **mtg-card-bot** | Python (uv) | **REWRITE** | Discord bot. Rewrite in TypeScript + Bun + discord.js. |
| **elchess** | Elixir (planned) | **REWRITE** | Chess platform. README-only, no code yet. Restart as TypeScript. |
| **scryai-swift** | Swift | **ARCHIVE** | Duplicate of scryai-typescript. Archive and delete. |
| **scryai-gorust** | None (empty) | **ARCHIVE** | Just SOUL.md + CLAUDE.md. No code. Delete. |
| **espanol** | Python (1 file) | **ARCHIVE** | Spanish tutor experiment. Tiny. Archive. |
| **elixir** | None (empty) | **ARCHIVE** | Just SOUL.md + CLAUDE.md. No code. Delete. |
| **configs** | Shell scripts | **KEEP** | Dotfile backups. Not a code project — just config files. Add CLAUDE.md. |

### Tier 4 — Content/Docs (light touch)

| Repo | Needs |
|---|---|
| **dunamismax** | GitHub profile README. Add CLAUDE.md. Update if stale. |
| **images** | Asset repo. Add CLAUDE.md. |
| **Sawyer-Visual-Media** | Business site submodules. Add CLAUDE.md. |
| **work** | Work desktop sync target. Add CLAUDE.md. |

---

## Identity Doc Deviations

Repos that have stale or wrong SOUL.md / AGENTS.md / CLAUDE.md:

| Repo | Issue |
|---|---|
| scryai-swift | Has old SOUL.md (lowercase "scry", stale content) + old AGENTS.md |
| scryai-gorust | Has old SOUL.md (references CLAUDE.md not AGENTS.md) + old CLAUDE.md |
| elixir | Has old SOUL.md + old CLAUDE.md |
| espanol | Has SOUL.md for different identity ("alma", Spanish tutor) |
| scry-trader | Has old CLAUDE.md only |
| All Tier 1 apps | Missing CLAUDE.md entirely |
| All Tier 4 repos | Missing CLAUDE.md entirely |

---

## Phases

### Phase 1: Add CLAUDE.md to All Active Repos
Add the standard CLAUDE.md (pointer to SOUL.md + AGENTS.md) to every repo that's staying.
Remove stale/wrong SOUL.md and AGENTS.md copies from repos (canonical source is scryai-typescript / OpenClaw workspace — repos just get CLAUDE.md).

- [ ] mylife-rpg
- [ ] poddashboard
- [ ] reactiveweb
- [ ] repo-monitor
- [ ] open-video-downloader
- [ ] CallRift
- [ ] mtg-card-bot
- [ ] scry-trader
- [ ] configs
- [ ] dunamismax
- [ ] images
- [ ] Sawyer-Visual-Media
- [ ] work
- [ ] elchess
- [ ] Remove stale SOUL.md/AGENTS.md/CLAUDE.md from: scryai-swift, scryai-gorust, elixir, espanol, scry-trader

### Phase 2: Archive Dead Repos
Archive and remove repos with no code or that duplicate TypeScript work.

- [ ] scryai-swift → archive on GitHub, delete local
- [ ] scryai-gorust → archive on GitHub, delete local
- [ ] elixir → archive on GitHub, delete local
- [ ] espanol → archive on GitHub, delete local

### Phase 3: Align Active Web Apps
Ensure all web apps pass lint + typecheck with current Biome, have consistent tsconfig, and match the stack contract.

- [ ] mylife-rpg — verify lint + typecheck clean
- [ ] poddashboard — verify lint + typecheck clean, add shadcn/ui init
- [ ] reactiveweb — verify lint + typecheck clean
- [ ] repo-monitor — verify lint + typecheck clean
- [ ] open-video-downloader — verify lint + typecheck clean

### Phase 4: Align CallRift (Mobile)
Bring the React Native app onto the current baseline.

- [ ] Upgrade React to 19+ (check Expo SDK compatibility)
- [ ] Replace expo lint (eslint) with Biome
- [ ] Replace zustand with TanStack Query where appropriate
- [ ] Add CLAUDE.md
- [ ] Verify typecheck clean

### Phase 5: Rewrite Python Repos in TypeScript
Convert active Python projects to TypeScript + Bun.

- [ ] mtg-card-bot → TypeScript + Bun + discord.js
- [ ] scry-trader → TypeScript + Bun (evaluate IBKR TS client availability)

### Phase 6: Rewrite elchess in TypeScript
Currently README-only. Restart as a TypeScript project.

- [ ] elchess → React + Bun + WebSocket chess server

### Phase 7: Populate MANAGED_PROJECTS
Update scryai-typescript `projects.config.ts` with all active repos so `scry:projects:doctor` tracks everything.

- [ ] Add all Tier 1 + Tier 2 repos to MANAGED_PROJECTS
- [ ] Verify `bun run scry:projects:doctor` reports on all repos

---

## Done Criteria

Every repo in `~/github` either:
1. Is TypeScript + Bun + Biome with CLAUDE.md and passing lint/typecheck, OR
2. Is a content/docs repo with CLAUDE.md and a clean README, OR
3. Has been archived and removed.

Zero Python. Zero Swift. Zero Go/Rust stubs. Zero stale identity docs.
One stack. One toolchain. One workflow.
