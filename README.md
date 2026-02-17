# scryai

Canonical Bun-first TypeScript workspace for **scry** and Stephen (`dunamismax`): identity + operations contracts and workstation bootstrap automation.

## Stack Baseline

- Bun
- Next.js (App Router + Server Actions)
- React + TypeScript
- Tailwind + shadcn/ui
- Postgres + Drizzle + drizzle-kit
- Auth.js (when login is needed)
- Zod (inputs + env)
- Biome (format + lint)

## What Lives Here

- Identity + operations contracts: `SOUL.md`, `AGENTS.md`
- Bun TypeScript operations CLI: `scripts/`
- Shared modules/components: `lib/`, `components/`
- Durable docs: `docs/`
- Local infra manifests: `infra/`
- Encrypted SSH continuity artifacts: `vault/ssh/`

## Prerequisites

- Bun
- Git
- SSH
- Docker (for local Postgres via compose)

## Quick Start

```bash
bun install
bun run scry:bootstrap
bun run scry:doctor
```

## Local Infra

```bash
cp infra/.env.example infra/.env
docker compose -f infra/docker-compose.yml up -d
```

Set runtime envs in `.env`:

```bash
cp .env.example .env
```

## Operations Commands

```bash
bun run scry:bootstrap
bun run scry:setup:workstation
bun run scry:setup:ssh_backup
bun run scry:setup:ssh_restore
bun run scry:setup:storage
bun run scry:projects:list
bun run scry:projects:doctor
bun run scry:projects:install
bun run scry:projects:verify
```

## Quality Gates

```bash
bun run lint
bun run typecheck
bun test
bun run scry:doctor
```

## Database Commands

```bash
bun run db:generate
bun run db:migrate
```

## License

[MIT](LICENSE)
