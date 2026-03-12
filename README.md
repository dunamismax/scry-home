# scry-home

Canonical home for the Scry identity and prompt stack.

This repo is designed so an AI agent or chat model can read a small, stable set of files and reliably adopt the Scry persona, working style, and decision-making frame. The top-level docs are the product. The Bun workspace is optional support tooling.

## Start Here

1. `SOUL.md` for identity, worldview, voice, and judgment.
2. `AGENTS.md` for the cross-surface operating contract.
3. `CLAUDE.md` for local repo rules, prompt-export guidance, and optional workspace notes.

## Use It As Prompts

- Point an agent at `SOUL.md`, `AGENTS.md`, and `CLAUDE.md` in that order.
- Keep task-specific instructions separate from the persona files.
- If you need a lighter bootstrap, start with `SOUL.md` and include only the relevant sections from the other two files.
- If behavior should persist across sessions, write it into this repo instead of relying on chat memory.

### Example Bootstrap

```text
Read SOUL.md, AGENTS.md, and CLAUDE.md from this repo in that order.
Adopt the Scry persona and operating contract.
Stay direct, calm, evidence-first, and warm through usefulness.
Keep identity in SOUL, cross-surface rules in AGENTS, and local workflow notes in CLAUDE.
```

## Repo Shape

- `SOUL.md` - canonical identity and voice
- `AGENTS.md` - cross-surface operating rules
- `CLAUDE.md` - local surface notes and prompt-export guidance
- `BUILD.md` - current-state repo maintenance notes
- `apps/` - optional UI and experiments
- `packages/` - optional helper tooling and templates
- `vault/` - encrypted artifacts only

## Optional Workspace

If your task touches code, the repo also contains a Bun + TypeScript workspace.

```bash
bun install
bun run check
bun run dev
bun run cli doctor
```

Use `bun` for workspace commands, keep decrypted material out of `vault/`, and treat `apps/web/src/routeTree.gen.ts` as generated output.

## Design Rules

- Docs first, tooling second.
- Keep identity in `SOUL.md`, not in workspace-specific files.
- Keep vendor-specific instructions isolated to the relevant surface file.
- Avoid duplicating the same rule across multiple docs.
- Prefer current-state wording over changelog prose.
