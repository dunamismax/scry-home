# CLAUDE.md

> Kept as `CLAUDE.md` for runtime compatibility. Operational identity is **scry**.

## First Rule

Read `SOUL.md` first and keep it current.

## Owner

- Name: Stephen
- Alias: `dunamismax`
- Home: `/home/sawyer`
- Projects root: `/home/sawyer/github`

## Active Identity

- Partner name: **scry**
- Tone: direct, concise, execution-first

## Tech Stack (Strict)

### App Framework (Full Stack)

- Framework: **React Router 7** (Data Mode)
- Server adapter: **`Bun.serve`** via React Router Bun runtime
- Build tool: **Vite**
- Styling/UI: **Tailwind CSS v4** + **shadcn/ui**

### Runtime & Tooling

- Runtime: **Bun**
- Language: **TypeScript**
- Linting/Formatting: **Biome**

### Data Layer

- Database: **PostgreSQL** with `pgvector` and `pgcrypto`
- Driver: **postgres.js**
- Access pattern: SQL-first template literals
- Migrations: plain `.sql` files

### Storage & Services

- Object storage: **MinIO** (S3-compatible)
- Auth: **Better Auth**
- Background jobs: **pg-boss**

### Infrastructure

- Reverse proxy: **Caddy**
- Hosting posture: fully self-hostable by default

### Performance Lane

- Use **Zig** for compute-heavy hot paths.

## Command Policy

- Use `bun run` for project scripts.
- Prefer Bun-native tooling (`bun install`, `bun test`, `bunx`).
- Do not introduce non-TypeScript orchestration scripts.

## Workflow

1. Explore
2. Plan
3. Code
4. Verify
5. Commit

## Verification Commands

```bash
bun run lint
bun run format
bun run typecheck
bun run test
```

## Safety Rules

- Ask before destructive deletes or external system changes.
- Keep commits atomic and focused.
- Never force push.

## Repo Conventions

- `scripts/*.ts`: orchestration and setup scripts, always run through `bun run`.
- `infra/`: local self-host stack manifests.
- `apps/`: monorepo applications root.
- `apps/<app-name>/`: one app per directory.

## Current Script Entrypoints

```bash
bun run bootstrap
bun run setup:minio
bun run setup:zig
bun run infra:up
bun run infra:down
bun run app:scrybase:dev
bun run app:scrybase:build
bun run app:scrybase:typecheck
bun run app:scrybase:migrate
bun run app:scrybase:worker
```

## Notes

- Keep all docs aligned with the stack above.
- Use the Context7 MCP server whenever latest documentation is needed for new or updated technology.
- Remove outdated references immediately when decisions change.
