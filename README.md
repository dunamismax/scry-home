# scryai

Canonical root repository for **scry** and Stephen (`dunamismax`): standards, infrastructure, and full-stack apps.

This README is the entrypoint for the entire repo. It tells you how to run shared infrastructure and where each project lives.

## What Lives Here

- Shared operating docs and identity: `SOUL.md`, `AGENTS.md`
- Shared local infrastructure: PostgreSQL + MinIO + Caddy in `infra/`
- Monorepo apps in `apps/`
- Root automation scripts in `scripts/`

## Current Projects

| Project | Type | Path | Docs |
|---|---|---|---|
| astro-web-template | Fresh Astro starter scaffold (from `npm create astro@latest`) and target full-stack website template app | `apps/astro-web-template` | [`apps/astro-web-template/README.md`](apps/astro-web-template/README.md) |
| astro-blog-template | Astro-based blog starter template with MDX/search/RSS/sitemap/PWA | `apps/astro-blog-template` | [`apps/astro-blog-template/README.md`](apps/astro-blog-template/README.md) |

App index: [`apps/README.md`](apps/README.md)

## Stack Baseline

All projects in this repo are expected to follow this baseline unless explicitly changed:

- Framework: Astro 5 (upgrade to Astro 6 after GA; beta announced January 27, 2026)
- Rendering: `output: "server"` + `@astrojs/node` adapter (`mode: "standalone"`) with selective prerendering of public routes
- Runtime: Bun for tooling/scripts + Node.js 22 LTS for production server runtime
- Build: Vite
- Server primitives: Astro Actions + Sessions + Middleware
- UI: Astro-first components with selective islands and hydration defaults (`client:visible`, `client:media`, `client:idle`)
- Styling: Tailwind CSS v4 + `@tailwindcss/vite` + `@tailwindcss/typography`
- Fonts: self-hosted
- Language: TypeScript
- Lint/format: Biome
- Database: PostgreSQL (`pgvector`, `pgcrypto`)
- DB access: `postgres.js` (SQL-first)
- Auth: Better Auth
- Jobs: pg-boss
- Object storage: MinIO
- Reverse proxy: Caddy
- Performance defaults: `astro:assets`, server islands for personalized widgets, prefetch strategy `viewport`, strict third-party script isolation

## Repository Layout

| Path | Purpose |
|---|---|
| `apps/` | Product applications (`apps/<name>`). |
| `infra/` | Shared local infrastructure (docker compose + Caddy). |
| `scripts/` | Root TypeScript orchestration scripts. |
| `SOUL.md` | Identity contract for scry. |
| `AGENTS.md` | Runtime operational contract for this repo. |

## Prerequisites

- `bun`
- `docker` + `docker compose`
- `git`
- `ssh`
- `curl`
- `tar`
- `openssl`
- `zig` (bootstrap can install/configure this path)

## Quick Start (Repo + App)

Run from the `scryai` repo root (`~/github/scryai`).

1. Install dependencies and initialize local defaults

```bash
bun install
bun run bootstrap
```

2. Start shared infrastructure

```bash
bun run infra:up
```

3. Open app and follow its setup

```bash
cd apps/astro-web-template
bun run dev
```

For app-specific details, always use that app's README:
[`apps/astro-web-template/README.md`](apps/astro-web-template/README.md)

## New System Bootstrap

Use this flow when provisioning a fresh machine from `scryai`:

1. Start rule: be inside `scryai` first

If you are **not already inside** the `scryai` repo:

```bash
mkdir -p ~/github
cd ~/github
git clone git@github.com:dunamismax/scryai.git
cd scryai
bun install
```

If you are **already inside** `scryai` (for example you cloned it manually and launched Codex there), keep going from that working directory.

2. Restore encrypted SSH backup (if available)

```bash
export SCRY_SSH_BACKUP_PASSPHRASE='use-a-long-unique-passphrase'
bun run setup:ssh:restore
```

3. Bootstrap all repos in order (`scryai` anchor first, then `dunamismax`, then the rest from `REPOS.md`)

```bash
bun run setup:workstation
```

`setup:workstation` guarantees this order:
- Ensure `~/github/scryai` exists first (anchor repo).
- Clone/fetch `~/github/dunamismax` second.
- Read `~/github/dunamismax/REPOS.md`.
- Clone/fetch all listed repos and enforce dual SSH push URLs.

4. Finish local tooling + infra setup

```bash
bun run bootstrap
```

5. Validate Git and SSH posture

```bash
ssh -T git@github.com
ssh -T git@codeberg.org
git -C ~/github/scryai remote get-url --all --push origin
```

SSH backup vault docs: [`vault/ssh/README.md`](vault/ssh/README.md)

## Root Commands

These run from repo root:

```bash
# Setup / health
bun run bootstrap
bun run setup:workstation
bun run setup:ssh:backup
bun run setup:ssh:restore
bun run setup:minio
bun run setup:zig
bun run doctor
bun run check:agent-docs

# Infra
bun run infra:up
bun run infra:down
bun run infra:logs

# Root quality gates (scripts + root config)
bun run lint
bun run format
bun run typecheck
bun run test
bun run ci
bun run perf:lighthouse
bun run perf:lighthouse:assert -- --report artifacts/lighthouse/current.json
```

## CI/CD

Automated CI runs on both:

- GitHub Actions: `.github/workflows/ci.yml`
- Codeberg Woodpecker: `.woodpecker.yml`

Pipelines run on push/pull-request and execute:

- Root quality gates (`lint`, `typecheck`, `test`)
- App quality gates for `apps/astro-web-template` (`build`)
- App quality gates for `apps/astro-blog-template` (`lint`, `typecheck`, `build`)
- Lighthouse audits in **mobile** + **desktop** modes
- Lighthouse assertions for LCP/CLS/TBT + category scores
- Lighthouse regression checks vs baseline commit when available

Performance thresholds are defined in `docs/performance/lighthouse-thresholds.json`.

## App Commands

Run these from inside an app directory (example: `apps/astro-web-template`):

```bash
bun run dev
bun run build
bun run preview
```

## Infra Defaults

Defaults come from `infra/.env.example`:

- PostgreSQL: `15432`
- MinIO API: `19000`
- MinIO Console: `19001`
- Caddy HTTP: `18080`
- Caddy HTTPS: `18443`

Compose services are defined in [`infra/docker-compose.yml`](infra/docker-compose.yml).
Caddy baseline config is in [`infra/Caddyfile`](infra/Caddyfile).

## Documentation Links

- Operational contract: [`AGENTS.md`](AGENTS.md)
- Identity contract: [`SOUL.md`](SOUL.md)
- Apps index: [`apps/README.md`](apps/README.md)
- astro-web-template docs: [`apps/astro-web-template/README.md`](apps/astro-web-template/README.md)
- astro-blog-template docs: [`apps/astro-blog-template/README.md`](apps/astro-blog-template/README.md)
- Performance CI docs: [`docs/performance/README.md`](docs/performance/README.md)

## Troubleshooting

- `ECONNREFUSED ...15432`: infra database is not running. Run `bun run infra:up`.
- `EADDRINUSE ...3000`: port in use. Set a different app `PORT` in app `.env`.
- Missing infra env file: run `bun run setup:minio` (or `bun run bootstrap`).

## License

[MIT](LICENSE)
