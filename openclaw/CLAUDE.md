# CLAUDE.md

> Workspace-specific instructions for **Scry**.
> This file is the local delta only: canonical-doc workflow, sync boundaries, and workspace sharp edges.
> Read in order: `SOUL.md` → `AGENTS.md` → `CLAUDE.md` → task-relevant code/docs.

---

## Scope

- Keep this file workspace-specific.
- If a rule belongs across repos or surfaces, move it to `AGENTS.md`.
- If a rule is about identity, worldview, voice, or relational stance, move it to `SOUL.md`.
- If this file grows large, split deeper/local concerns into closer docs and keep this top-level file crisp.

---

## Workspace Role

- This workspace is the canonical source for Scry's core operating docs.
- Root `SOUL.md`, `AGENTS.md`, and `CLAUDE.md` here are the live source for OpenClaw behavior and should be edited here first.
- The mirror repo at `~/github/scry-home` receives synchronized copies for backup, versioning, and specialist propagation.
- Files under `~/github/scry-home/openclaw/` are mirrors. Do **not** treat them as the source of truth for main-workspace docs.

---

## Working Defaults

- Use this workspace for canonical edits to Scry core docs and memory.
- When a task becomes multi-step or phase-based, maintain root `BUILD.md` per `AGENTS.md`.
- If a change alters future behavior in a durable way and that change is not obvious from the docs alone, record it in `MEMORY.md` or daily memory as appropriate.
- Keep diffs narrow and intentional; repair drift instead of layering workaround prose on top of stale instructions.

---

## Core Commands

### Sync canonical docs outward

```bash
cd ~/github/scry-home && uv run python -m scripts sync:openclaw
```

Use this after canonical workspace doc changes so repo-root and `openclaw/` mirror copies stay aligned.

### Harden specialist workspaces

```bash
cd ~/github/scry-home && uv run python -m scripts specialists:harden
```

Use this when shared templates, hooks, or propagated specialist workspace docs need to be refreshed.

### Repo lint for mirrored docs/scripts

```bash
cd ~/github/scry-home && bun run lint
```

Run this when the mirrored repo contents changed and lint is relevant to the touched files.

---

## Verification Rules for This Workspace

- **Core doc edits (`SOUL.md`, `AGENTS.md`, `CLAUDE.md`):** re-read changed files for consistency, then run `sync:openclaw` so downstream copies are updated.
- **Mirror-affecting changes:** run `bun run lint` in `~/github/scry-home` if it covers the changed files; otherwise do a manual consistency pass and say so.
- **Specialist propagation changes:** run `specialists:harden` when the task changes shared specialist templates, hooks, or propagated workspace docs.

Always report what was run, what was not run, and any residual risk.

---

## Sharp Edges

- Do **not** hand-edit mirrored `~/github/scry-home/openclaw/` files to change canonical main-workspace docs.
- Do **not** let root repo copies drift after changing canonical workspace docs; sync them.
- Do **not** confuse backup/versioning mirrors with the live source of truth.
- OpenClaw gateway config changes, updates, or runtime mutations still require explicit user ask when policy says so.

---

## Handoff Notes

When handing off workspace doc work, include:

1. Outcome / decision
2. Exact files changed
3. Commands run
4. Remaining blockers or human decisions
5. Whether mirror sync and specialist propagation were completed
