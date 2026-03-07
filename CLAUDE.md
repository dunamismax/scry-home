# CLAUDE.md

> Repo-specific instructions for **Scry** in this repository.
> This file is the local delta only: commands, topology, sharp edges, and sync boundaries.
> Read in order: `SOUL.md` → `AGENTS.md` → `CLAUDE.md` → task-relevant code/docs.

---

## Scope

- Keep this file repo-specific.
- If a rule belongs across repos or workspaces, move it to `AGENTS.md`.
- If a rule is about identity, worldview, voice, or relational stance, move it to `SOUL.md`.
- If this file grows large, split deeper/local concerns into closer docs and keep this top-level file crisp.

---

## Repo Map

- CLI entrypoint: `scripts/cli.py`
- Tasks live under: `scripts/tasks/`
- `openclaw/` is auto-synced from the OpenClaw workspace. Treat it as a mirror; do **not** edit files there directly.
- `vault/` contains encrypted backups. Never commit decrypted material.
- Root `SOUL.md` and `AGENTS.md` are synced from the OpenClaw workspace (canonical source). Local edits here will be overwritten on the next sync unless they are propagated upstream.

---

## Working Defaults

- Read `scripts/cli.py` first when tracing CLI behavior.
- Read the relevant file under `scripts/tasks/` first when changing task execution.
- Use `uv` for Python commands in this repo.
- Keep diffs narrow and consistent with the repo's existing structure.
- When a task becomes multi-step or phase-based, maintain root `BUILD.md` per `AGENTS.md`.

---

## Core Commands

### Repo health / prerequisites

```bash
uv run python -m scripts doctor
```

Use this for a functional repo health check and prerequisite validation.

### Lint

```bash
bun run lint
```

Run before handoff or commit. If lint is unavailable or fails for unrelated existing reasons, say so explicitly.

### Remote sync repair

```bash
uv run python -m scripts sync:remotes --fix
```

Use this when setting up or repairing dual-push remotes on a new or drifted clone.

---

## Verification Rules for This Repo

- **Docs/config only:** run `bun run lint` if it covers the changed files; otherwise do a manual consistency pass.
- **CLI/task behavior changes:** run `uv run python -m scripts doctor` after changes, plus any narrower command path that exercises the modified flow safely.
- **Repo setup / git remote changes:** run `uv run python -m scripts sync:remotes --fix` only when the task actually touches remote configuration, and report what it changed.

Always report what was run, what was not run, and any residual risk.

---

## Sharp Edges

- Do **not** edit `openclaw/` directly. Change the canonical source and let sync propagate it.
- Do **not** commit decrypted secrets from `vault/`.
- Do **not** assume local root copies of `SOUL.md` / `AGENTS.md` are the source of truth; they are sync targets unless this repo *is* the canonical workspace.
- Multi-agent bench governance (specialist delegation + maintenance rules) lives in workspace `SOUL.md` / `AGENTS.md` and is propagated by sync.

---

## Handoff Notes

When handing off repo work, include:

1. Outcome / decision
2. Exact files changed
3. Commands run
4. Remaining blockers or human decisions
5. Whether anything touched sync-governed files that must be updated upstream

This repo should feel boring to operate: clear entrypoints, verified commands, no mystery state.
