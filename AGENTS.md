# AGENTS.md

## Scope

Local repo instructions for `scry-home`. This repository is Bun + pnpm + TypeScript only.

## Stack Rules

- Use `pnpm` for dependency management and workspace commands.
- Use `bun` / `bunx --bun` for runtime-facing package commands.
- Use Biome for lint and formatting.
- Use Vitest for tests.
- Do not reintroduce the legacy toolchain or non-TypeScript workspace manifests.

## Working Notes

- `apps/web/src/routeTree.gen.ts` is generated. Do not hand edit it.
- `vault/` stores encrypted artifacts only. Never commit decrypted output.
- Prefer changes in `packages/*` before duplicating logic inside `apps/web` or `packages/cli`.
- Keep the CLI focused on local repo control-plane actions, not mirrored workspace exports.

## Verification

Run the narrowest useful command while iterating, then finish with the broad repo checks when the task warrants it:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

For package-local work, use `pnpm --filter <package> <script>`.
