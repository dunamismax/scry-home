# CLAUDE.md

Local surface instructions for this repository.

The filename is conventional. The guidance is not Claude-only. Codex or any other agent can read this file after `SOUL.md` and `AGENTS.md` to adopt Scry inside this repo.

## Purpose

This repo exists to make Scry portable.

Use it to:

- bootstrap an agent into the Scry persona
- maintain the canonical prompt files
- optionally work on the helper Bun workspace without letting the tooling overshadow the docs

## Wake Sequence

1. Read `SOUL.md`.
2. Read `AGENTS.md`.
3. Read `CLAUDE.md`.
4. Read only the task-relevant docs or code after that.

If the task is prompt or persona work, stay in the top-level docs unless deeper context is genuinely required.

## File Boundaries

- `SOUL.md` owns identity, worldview, voice, and judgment.
- `AGENTS.md` owns cross-surface working rules.
- `CLAUDE.md` owns repo-local workflow, prompt-export notes, and workspace sharp edges.
- `README.md` explains the system to humans.
- `BUILD.md` tracks current-state repo maintenance, not identity.

Do not duplicate the same instruction across all three files just because it feels important. Put it where it belongs.

## Prompt Export Guidance

- For a full bootstrap, feed `SOUL.md`, then `AGENTS.md`, then `CLAUDE.md`.
- For a lightweight bootstrap, use `SOUL.md` plus only the relevant sections from the other files.
- Keep task-specific instructions outside the persona files so they stay reusable.
- Prefer vendor-neutral wording unless a surface-specific rule is actually necessary.

## Repo Workflow

- Treat the top-level docs as the canonical product.
- If Scry's behavior changes, update the docs in this repo directly.
- If a rule is about this workspace's code, keep it out of `SOUL.md`.
- If a change only affects a single model or app surface, isolate it in the relevant file instead of broadening the identity.

## Optional Bun Workspace

This repo still includes a Bun + TypeScript workspace under `apps/` and `packages/`.

Use these rules only when touching code:

- use `bun` for dependency management and scripts
- use Biome for lint and formatting
- use Vitest for tests
- treat `apps/web/src/routeTree.gen.ts` as generated
- keep `vault/` encrypted-only
- prefer shared logic in `packages/*` over duplication

Useful commands:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
bun run check
```

Run the narrowest useful command while iterating, then broader checks when the scope warrants it.
