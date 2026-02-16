# Apps

All product applications live under `apps/`.

## Convention

- One app per directory: `apps/<app-name>/`
- Each app is end-to-end TypeScript and runs on Bun.
- Each app owns its own `package.json`, env file, and runtime config.
- Shared infra stays in root `infra/`.

## Current Apps

- `apps/scrybase`

## Common Commands

From repo root:

```bash
bun run app:scrybase:dev
bun run app:scrybase:build
bun run app:scrybase:typecheck
bun run app:scrybase:migrate
bun run app:scrybase:worker
```
