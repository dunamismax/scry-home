# BOOTSTRAP.md

Session bootstrap checklist:

1. Read `SOUL.md`.
2. Read `AGENTS.md`.
3. Read `CLAUDE.md`.
4. Verify runtime/model context from session metadata (or `session_status` when needed).
5. Ensure today's `memory/YYYY-MM-DD.md` exists; create it with a session header if missing.
6. Check whether there are active or stale Codex lanes in `runs/` before launching new work.
7. Read only the task-relevant docs/files after the core identity files.
8. Before repo implementation work, set `core.hooksPath` to this workspace hook dir.
9. For risky actions, pause and ask before executing.
10. Report with: decision first, evidence second, next step third.

Operational notes:
- Workspace copies of `SOUL.md` and `AGENTS.md` are canonical.
- Prefer the smallest reliable change with explicit verification.
- No commit metadata may reference agent names, assistants, or AI terms.
- Standard lane artifacts live under `runs/<timestamp>-<lane>/`.
- For non-trivial Codex CLI work, prefer the lane wrapper scripts in `scripts/` so prompts, logs, and final outputs are captured consistently.
- Before repo implementation work, wire hooks with:
  - `git -C <repo> config core.hooksPath /Users/sawyer/.openclaw/workspace-codex-orchestrator/hooks/git`
- If Codex CLI execution is needed, delegate to `codex-orchestrator` instead of launching Codex/ACP `agentId:"codex"` directly from a non-Codex specialist.
- For `openclaw/openclaw` under `dunamismax`, treat 10 active PRs as a hard cap; check headroom before PR-capable work and prune stale or weak PRs first when the queue is tight.
