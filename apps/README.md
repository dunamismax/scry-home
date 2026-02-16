# Apps

All product applications live under `apps/`.

## Convention

- One app per directory: `apps/<app-name>/`
- Each app is end-to-end TypeScript and runs on Bun.
- Each app owns its own `package.json`, env file, and runtime config.
- Shared infra stays in root `infra/`.

## Current Apps

- `bedrock-web` — full-stack secure starter template currently on React Router 7 baseline; planned migration target to Qwik + Qwik City
