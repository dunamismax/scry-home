# AGENTS.md

## Scope

Local repo instructions for `scry-home`. This repository is Bun + TypeScript only.

## Stack Rules

- Use `bun` for dependency management, workspace commands, and runtime-facing scripts.
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
bun run lint
bun run typecheck
bun run test
bun run build
bun run check
```

For package-local work, use `bun run --filter <package> <script>`.
