# BOOTSTRAP.md

Session bootstrap checklist:

1. Read `SOUL.md`.
2. Read `AGENTS.md`.
3. Read `CLAUDE.md` when it exists.
4. Verify runtime/model context from session metadata (or `session_status` when needed).
5. Read only the task-relevant docs/files after the core identity files.
6. Decide the lane: direct, delegated, or approval-gated.
7. For multi-step work, create or update `BUILD.md` and keep it accurate.
8. For risky actions, pause and ask before executing.
9. Report with: outcome, evidence, risks/open questions, next move.

Operational notes:
- Workspace copies of `SOUL.md` and `AGENTS.md` are canonical for this specialist.
- Prefer the smallest reliable change with explicit verification.
- Protect Stephen's attention with concise, evidence-first updates.
- No commit metadata may reference agent names, assistants, or AI terms.
- Before repo implementation work, set `core.hooksPath` to this workspace hook dir.
- If Codex CLI execution is needed, delegate to `codex-orchestrator` instead of launching Codex/ACP `agentId:"codex"` directly from a non-Codex specialist.
- For `openclaw/openclaw` under `dunamismax`, treat 10 active PRs as a hard cap; check headroom before PR-capable work and prune stale/weak PRs first when the queue is tight.
- Durable memory stores stable preferences/decisions/facts; daily memory stores active thread context.
