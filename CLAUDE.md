# CLAUDE.md

> **This is a living document.** It must be kept accurate and up to date at all times. Update this file whenever new conventions, tools, preferences, or instructions are established. Prune anything that becomes outdated. Short, explicit, actionable instructions outperform long vague ones -- keep it tight.

## First Things First

**Read `SOUL.md` before doing anything.** That file defines who Stephen is, who Claude is in this partnership, and the spirit of how we work. Keep it updated as you learn new things.

## Owner

- **Name:** Stephen
- **Environment:** Ubuntu VM (WSL2), terminal-first workflow
- **Home:** `/home/sawyer`
- **Projects Root:** `/home/sawyer/github/`

---

## Tech Stack (Mandatory -- No Exceptions)

### Infrastructure & Platform

| Layer | Tool | Notes |
|---|---|---|
| **Platform** | Ubuntu 24.04 LTS, Docker, Docker Compose | Production and development environments. |
| **Edge/SSL** | Caddy | Reverse proxying to the Node.js application port. Handles TLS automatically. |
| **CI/CD** | GitHub Actions | Builds the TanStack Start artifact, deploys via SSH. |
| **Backups** | `pg_dump` | Nightly dumps to external object storage. |

### Application Layer

| Layer | Tool | Notes |
|---|---|---|
| **Language** | TypeScript | Everything. Apps, scripts, automation, glue code, one-off tasks. Always `.ts`, never `.js`. |
| **Script Runtime** | Bun | Stephen's favorite tool. All scripts run with `bun run`. Use `bun` for package management. Prefer Bun built-ins over third-party alternatives (e.g. `Bun.serve`, `Bun.file`, `Bun.write`, `Bun.hash`, `Bun.sleep`, built-in SQLite, built-in test runner, built-in bundler). Always use the latest version and cutting-edge features. |
| **Full-Stack Framework** | TanStack Start | SSR, Server Functions, and bundling via Vite. The only framework. Do not suggest Next.js, Remix, Nuxt, SvelteKit, or anything else. |
| **Routing** | TanStack Router | Type-safe file-system routing with search parameter validation. |
| **Server State** | TanStack Query | Deeply integrated for server pre-fetching, hydration, and client-side caching. Never raw `fetch` in components. |
| **Tables** | TanStack Table | Headless UI for data grids, including AI/vector data sets. |
| **Forms** | TanStack Form | Headless, type-safe form validation and submission. |
| **Styling & UI** | Tailwind CSS + shadcn/ui | Utility-first CSS with pre-built accessible components. |
| **Auth** | Better Auth | Type-safe authentication with PostgreSQL adapter. |

### Data Layer

| Layer | Tool | Notes |
|---|---|---|
| **Database** | PostgreSQL 16 + `pgvector` | Primary data store with vector similarity search. |
| **ORM** | Drizzle ORM | Best-in-class TypeScript inference. Matches TanStack's type-safe philosophy. |

### Monitoring

| Layer | Tool | Notes |
|---|---|---|
| **Observability** | OpenTelemetry + SigNoz | Instrumenting the server entry point for full-stack tracing. |

### Why This Stack

- TanStack is framework-agnostic at its core, type-safe by default, and Tanner Linsley ships quality.
- Bun is fast, runs TypeScript natively, and eliminates tooling friction.
- TypeScript everywhere means one language, one mental model, zero context-switching.
- Drizzle ORM gives TypeScript-first schema definitions with inference that feels native to the TanStack ecosystem.
- Better Auth is type-safe and framework-agnostic -- no fighting the auth layer.
- PostgreSQL + pgvector keeps vector search in the database where it belongs -- no separate vector DB to manage.
- Caddy handles TLS automatically with zero config. No Nginx conf files, no certbot cron jobs.
- OpenTelemetry is vendor-neutral. SigNoz today, anything else tomorrow.

---

## Workflow: Explore, Plan, Code, Commit

Follow this order for any non-trivial task:

1. **Explore** -- Read relevant files. Understand existing code before touching it. Never propose changes to code you haven't read.
2. **Plan** -- Formulate a strategy. For anything beyond a small fix, discuss the approach before writing code.
3. **Code** -- Implement. Keep changes minimal and focused.
4. **Verify** -- Run tests, type-check, or manually verify. Never ship unverified code.
5. **Commit** -- Atomic commits with clear "why" messages.

### TanStack MCP Server (Mandatory)

**Always use the TanStack MCP server** (`tanstack_doc`, `tanstack_search_docs`, `tanstack_list_libraries`) to pull current documentation before writing or modifying TanStack code. TanStack is bleeding-edge -- APIs change frequently. Never assume patterns from memory are current. Query the MCP first.

---

## Git & GitHub Rules

- **Never push directly to main/master.** Always work on feature branches and create pull requests.
- **Never force push.** No `--force`, no `reset --hard` on shared branches.
- **Never skip hooks.** No `--no-verify`.
- Commit messages describe the *why*, not the *what*. The diff shows what changed.
- Keep commits atomic -- one logical change per commit.
- Branch naming: `feature/description`, `fix/description`, `chore/description`.

---

## Permissions & Safety

### Do Without Asking

- Read any file
- Search the codebase
- Run type-checking (`bun run typecheck`, `tsc --noEmit`)
- Run tests
- Run linters
- Create feature branches
- Write or edit code files as part of an agreed-upon task

### Ask Before Doing

- Installing or removing packages/dependencies
- Deleting files or directories
- Modifying CI/CD configuration
- Changing project structure significantly
- Any operation that affects systems outside the local repo
- Running database migrations
- Creating new projects/repos

---

## Code Standards

### Do

- Write clean, readable TypeScript with proper types. Infer where possible, annotate where necessary.
- Prefer `const` over `let`. Never use `var`.
- Use async/await over raw promises.
- Use TanStack Query for all server state -- mutations, queries, invalidation.
- Use TanStack Router's type-safe patterns -- `Link`, route params, search params.
- Handle errors at system boundaries (user input, API responses, external data).
- Name things clearly. A good name eliminates the need for a comment.
- Prefer early returns over deep nesting.
- Prefer flat over nested. Prefer simple over clever.

### Don't

- Don't use `any`. If you're reaching for `any`, the types are wrong -- fix them.
- Don't use raw `fetch` in components. That's what TanStack Query is for.
- Don't hardcode values that could change (URLs, keys, magic numbers). Use config/env.
- Don't add comments to code you didn't write or change.
- Don't create abstractions for things used only once. Three similar lines > premature abstraction.
- Don't add error handling for impossible states. Trust internal code.
- Don't over-engineer. Solve today's problem, not next year's hypothetical.
- Don't leave `console.log` in production code. Use proper logging if needed.
- Don't use `index` as a key in lists with dynamic items.
- Don't mix server state and client state. They are different concerns.

---

## File-Scoped Commands

Use these to verify changes without running full project builds:

```bash
# Type-check a single file
bun run tsc --noEmit path/to/file.ts

# Run a single test file
bun test path/to/file.test.ts

# Lint a single file (when linter is configured)
# bun run lint path/to/file.ts
```

*(Update these as projects are configured.)*

---

## Testing Strategy

*(To be configured per-project. Update this section when decisions are made.)*

Defaults until otherwise specified:

- Test runner: Bun's built-in test runner (`bun test`)
- Focus on integration tests over unit tests where practical
- Test behavior, not implementation details
- Every bug fix should include a regression test

---

## Project Structure Conventions

Standard TanStack Start project layout (established with Scrybase):

```
src/
  routes/          # File-based routes (TanStack Router auto-generates routeTree.gen.ts)
  components/
    ui/            # shadcn/ui components (added via `bun dlx shadcn@latest add`)
  lib/             # Utilities, helpers, shared logic
  hooks/           # Custom hooks
  styles/          # Tailwind v4 CSS (globals.css with @theme)
  server/          # Server-only code
    db/            # Drizzle schema + connection
    auth.ts        # Better Auth instance
  router.tsx       # Router factory (exports getRouter)
  client.tsx       # Client entry point
  ssr.tsx          # Server entry point
  env.ts           # Runtime env validation
```

---

## Active Projects

| Project | Path | Status | Description |
|---|---|---|---|
| Claude | `/home/sawyer/github/Claude` | Active | Meta-repo: Claude's identity, config, and documentation |
| Scrybase | `/home/sawyer/github/Claude/scrybase` | Active | RAG-as-a-Service platform. Upload docs, get a queryable AI API back. Domain: `scrybase.app` (Cloudflare DNS). |

*(Add projects here as they are created.)*

---

## Lessons Learned

*(Log non-obvious discoveries, gotchas, and hard-won knowledge here. Future sessions benefit from past pain.)*

| Date | Lesson |
|---|---|
| 2026-02-16 | Initial setup. AGENTS.md renamed to CLAUDE.md per Claude Code conventions. |
| 2026-02-16 | TanStack Start migrated from Vinxi to Vite. Use `@tanstack/react-start/plugin/vite` (named export `tanstackStart`), not Vinxi. |
| 2026-02-16 | TanStack Start's `server.handlers` route option and `createFileRoute` path types are augmented by the Vite plugin at build time -- raw `tsc` may not see them, but `bun run dev` / `bun run build` work fine. |
| 2026-02-16 | `StartClient` (from `@tanstack/react-start/client`) takes no props. Router is resolved via virtual module `#tanstack-router-entry` by the Vite plugin. Export `getRouter` from `router.tsx`. |
| 2026-02-16 | `HeadContent` and `Scripts` are from `@tanstack/react-router`, not `@tanstack/react-start`. |
| 2026-02-16 | Better Auth with TanStack Start needs `tanstackStartCookies()` plugin from `better-auth/tanstack-start`. Auth routes use `server.handlers` on a catch-all `$.ts` route. |
| 2026-02-16 | Tailwind v4 uses CSS-first config (`@theme` in CSS) -- no `tailwind.config.js` needed. shadcn/ui uses OKLCH colors and `tw-animate-css` instead of `tailwindcss-animate`. |
| 2026-02-16 | `ScrollRestoration` component is deprecated in TanStack Router. Use `scrollRestoration: true` in `createRouter` options instead. |
| 2026-02-16 | Local dev pattern: `docker compose up -d` for Postgres + pgvector, `.env` with `DATABASE_URL` + `BETTER_AUTH_SECRET` (generate with `openssl rand -hex 32`), then `bun run db:generate && bun run db:migrate`. Enable `vector` extension manually before first migration: `docker compose exec db psql -U scrybase -c "CREATE EXTENSION IF NOT EXISTS vector;"` |
| 2026-02-16 | TanStack MCP server configured (`.mcp.json` at repo root). Use it to pull up-to-date docs, search TanStack APIs, and explore add-ons. TanStack moves fast -- always query the MCP before assuming API shapes or patterns are current. |

---

## Notes

*(Running notes, reminders, and context.)*

- **Domain:** `scrybase.app` -- owned by Stephen, DNS managed on Cloudflare with full control.
- **Version philosophy:** Always latest. Bun, TanStack, and all dependencies should be the newest stable (or even canary if Stephen asks). No pinning to old versions "for safety." Cutting edge is the default.
