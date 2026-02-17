# scryai

Identity and operations repo for **scry** and Stephen (`dunamismax`).

## Stack Baseline

- Bun
- Vite + TanStack Start (routing, SSR, server functions)
- React + TypeScript
- Tailwind + shadcn/ui
- Postgres + Drizzle + drizzle-kit
- Auth.js (when login is needed)
- Zod (inputs + env)
- Biome

## What Lives Here

- Identity + operations contracts: `SOUL.md`, `AGENTS.md`
- Bun TypeScript operations CLI: `scripts/`
- No committed app scaffold by default in this repo

Core files:
- `SOUL.md`
- `AGENTS.md`
- `README.md`
- `scripts/`

## Quick Start

```bash
bun install
bun run scry:bootstrap
bun run scry:doctor
```

## Operations Commands

```bash
bun run scry:bootstrap
bun run scry:setup:workstation
bun run scry:setup:ssh_backup
bun run scry:setup:ssh_restore
bun run scry:projects:list
bun run scry:projects:doctor
bun run scry:projects:install
bun run scry:projects:verify
```

## Quality Gates

```bash
bun run lint
bun run typecheck
bun run scry:doctor
```

## License

[MIT](LICENSE)
