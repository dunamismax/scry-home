# Qwik Cutover Plan (No App Rewrite Yet)

Last updated: 2026-02-16

## Scope

- Goal: migrate repo baseline from React/React Router to Qwik + Qwik City while keeping Bun + TypeScript and the existing infra/data stack.
- This document intentionally does **not** rewrite `apps/bedrock-web` route/component code yet.
- This is the execution plan for the next implementation passes.

## Current Snapshot

Primary target app for migration planning:

- `apps/bedrock-web/package.json`
- Current frontend stack: React 19 + React Router 7 + Radix/shadcn-style components.
- Current auth implementation: Better Auth mounted at `/api/auth/*` with custom role/isActive fields and DB-backed rate limiting.

## Package / Dependency Map

This map is for `apps/bedrock-web` and is split into `keep`, `replace`, and `remove`.

## Keep (unchanged)

- Runtime/tooling: `typescript`, `vite`, `@types/bun`, `@types/node`, `@biomejs/biome`
- Styling base: `tailwindcss`, `@tailwindcss/vite`
- Data/services: `postgres`, `pg-boss`, `zod`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- Auth core: `better-auth`
- Utilities: `clsx`, `tailwind-merge`

## Keep (for now, with review flag)

- `kysely`, `kysely-postgres-js`
  - Reason: currently used by Better Auth DB dialect in `app/lib/auth.server.ts`.
  - Review in migration: keep if Better Auth still requires this adapter path after Qwik port; remove only if a direct `postgres.js` path is adopted.

## Replace

- Framework core:
  - Remove React Router stack and replace with Qwik stack:
    - `react-router`, `@react-router/dev`, `@react-router/node`, `@react-router/serve`
    - Target: `@builder.io/qwik`, `@builder.io/qwik-city`
  - Vite config plugins:
    - From `@react-router/dev/vite`
    - To `qwikCity()` from `@builder.io/qwik-city/vite` and `qwikVite()` from `@builder.io/qwik/optimizer`
- UI primitives/components:
  - Replace React-only primitives (`@radix-ui/react-label`, `@radix-ui/react-slot`) with Qwik-native primitives/components.
  - Recommended icon replacement for `lucide-react`: `@qwikest/icons` (`@qwikest/icons/lucide` subset).

## Remove

- React runtime/types:
  - `react`, `react-dom`, `@types/react`, `@types/react-dom`
- React Router config artifacts:
  - `react-router.config.ts`
  - `.react-router/` generated types directory (once Qwik cutover completes)

## Script Map (planned target)

Current script surface is React Router CLI-based. Target script surface should be Qwik CLI + Qwik City adapter-based.

- Keep command names where possible: `dev`, `build`, `serve`, `typecheck`, `lint`, `format`, `test`
- Use Qwik integrations to generate/update scripts instead of hand-rolling:
  - `bun run qwik add bun`
  - `bun run qwik add tailwind`
- Expected production pattern after adapter integration:
  - `bun run build` (drives `build.server` + `build.client`)
  - `bun run serve`

## Auth Strategy Decision

## Decision

Keep **Better Auth** for the Qwik migration.

## Why this is the current best choice

- Existing auth behavior is already implemented and production-shaped (RBAC fields, activation flag, rate limiting, secure cookie config).
- Better Auth is framework-agnostic and exposes:
  - server APIs through `auth.api`
  - request handling through `auth.handler(request)`
  - framework-agnostic client path via `better-auth/client`
- This minimizes blast radius and avoids a second major migration (auth + framework) at the same time.

## Alternative considered

- `@auth/qwik` (Auth.js for Qwik) has first-class Qwik integration, but Qwik docs currently note Auth.js is still pre-1.0 and may have bugs.
- Switching now would require replacing current Better Auth data/model conventions and endpoint behavior during the same cutover.

## Revisit trigger

Re-open auth decision if one of these becomes true:

- Better Auth releases first-class Qwik-specific integration that materially reduces implementation risk.
- Auth.js reaches stable 1.x with clear migration path and benefits that outweigh rework cost.
- Product requirements demand provider flows/features significantly easier with Auth.js than Better Auth.

## Phased Cutover Checklist

## Phase 0: Baseline Freeze (done)

- [x] Repo-level contracts switched to Qwik baseline (`SOUL.md`, `AGENTS.md`, `README.md`).
- [x] Mark current app as pending migration target (`apps/README.md`).
- [x] Root verification gates passing (`bun run check:agent-docs`, `bun run lint`).

## Phase 1: Scaffold Qwik Runtime Surface (no feature rewrite)

- [ ] Create Qwik app skeleton for `bedrock-web` migration branch/work area.
- [ ] Add Bun deployment integration (`bun run qwik add bun`).
- [ ] Add Tailwind integration (`bun run qwik add tailwind`).
- [ ] Wire Biome/TypeScript settings to match repo standards.
- [ ] Verify `dev`, `build`, and `serve` scripts run.

Gate:

- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run build`

## Phase 2: Platform Parity (infra and server concerns)

- [ ] Port env contract and validation to Qwik runtime.
- [ ] Port DB connection and SQL access layer unchanged (postgres.js).
- [ ] Port MinIO and pg-boss server wiring unchanged.
- [ ] Port security headers/CSP/same-origin protections into Qwik middleware/request pipeline.

Gate:

- [ ] Health check endpoint responds as expected.
- [ ] Infra-backed operations connect successfully (Postgres/MinIO).

## Phase 3: Auth Port (Better Auth on Qwik)

- [ ] Mount Better Auth handler in Qwik route endpoint for `/api/auth/*`.
- [ ] Port auth utility layer (`getSession`, guard helpers, redirect helpers).
- [ ] Port sign-in/sign-up/sign-out flows to Qwik routes/actions.
- [ ] Confirm role/isActive behavior and account-disabled redirect behavior match current app.

Gate:

- [ ] Session cookie set/refresh/sign-out behavior verified.
- [ ] Protected routes reject anonymous/disabled users correctly.
- [ ] Auth rate limit rules still enforced.

## Phase 4: UI System Migration

- [ ] Replace React-only UI primitives (Radix React/shadcn-style wrappers) with Qwik-native equivalents.
- [ ] Port core shell/layout/navigation components.
- [ ] Replace icon imports (`lucide-react` -> Qwik-friendly icon strategy).

Gate:

- [ ] No React/RR imports in migrated app code.
- [ ] Visual regression spot-check passes for core layouts.

## Phase 5: Feature Route Migration

- [ ] Port routes in priority order:
  - [ ] Landing/index
  - [ ] Auth pages
  - [ ] App shell + dashboard
  - [ ] Profile/settings
  - [ ] Admin users
  - [ ] Upload endpoints/UI
- [ ] Keep DB schema and service behavior equivalent unless explicitly changed.

Gate:

- [ ] Feature parity checklist signed off.
- [ ] Existing tests pass or are replaced by equivalent Qwik tests.

## Phase 6: Cutover + Cleanup

- [ ] Switch default app runtime to Qwik implementation.
- [ ] Remove React/React Router packages and config files.
- [ ] Remove obsolete docs/scripts references to React Router.
- [ ] Regenerate lockfile cleanly after package removals.

Gate:

- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run test`
- [ ] `bun run build`
- [ ] Manual smoke test for auth + RBAC + uploads + jobs

## References

- Qwik deployments and integrations:
  - https://qwik.dev/docs/deployments/
  - https://qwik.dev/docs/deployments/bun/
  - https://qwik.dev/docs/integrations/
  - https://qwik.dev/docs/integrations/tailwind/
  - https://qwik.dev/docs/advanced/vite/
  - https://qwik.dev/docs/integrations/icons/
- Qwik Auth.js integration note:
  - https://qwik.dev/docs/integrations/authjs/
- Better Auth framework-agnostic docs:
  - https://www.better-auth.com/docs
  - https://www.better-auth.com/docs/concepts/client
  - https://www.better-auth.com/docs/concepts/api
  - https://www.better-auth.com/docs/integrations/astro
