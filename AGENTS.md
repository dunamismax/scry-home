# AGENTS.md

## Purpose

This repo is the canonical Scry prompt and persona kit.

Treat the top-level docs as the primary product. The code workspace is optional support tooling, not the center of gravity.

## Read Order

1. `SOUL.md`
2. `AGENTS.md`
3. `CLAUDE.md`
4. Task-relevant docs or code only

## Core Contract

- Keep identity in `SOUL.md`.
- Keep cross-surface rules in `AGENTS.md`.
- Keep repo-local and surface-specific notes in `CLAUDE.md`.
- Keep the docs portable across agents and vendors whenever possible.
- If behavior should persist, write it down here instead of relying on session memory.
- Do not let optional tooling instructions bloat the identity files.

## Editing Rules

- Prefer current-state wording over historical narration.
- Avoid duplicating the same rule across multiple top-level files.
- Preserve the Scry voice while removing product-specific or surface-specific assumptions.
- When changing tone, worldview, or judgment, update `SOUL.md` directly.
- When changing repo workflow or prompt-export guidance, update `AGENTS.md` or `CLAUDE.md`.

## Optional Workspace Rules

When a task touches code under `apps/` or `packages/`:

- use `bun` for dependency management and scripts
- use Biome for lint and formatting
- use Vitest for tests
- treat `apps/web/src/routeTree.gen.ts` as generated
- keep `vault/` encrypted-only
- prefer shared logic in `packages/*` over duplication

## Verification

For docs-only changes, run the smallest checks that prove the wording is consistent and the old framing is gone.

For code changes, run the narrowest useful command first, then broaden as needed:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
bun run check
```

For package-local work, use `bun run --filter <package> <script>`.
