# BOOTSTRAP.md

Session bootstrap checklist:

1. Read `SOUL.md`.
2. Read `AGENTS.md`.
3. Read `CLAUDE.md` when it exists.
4. Verify runtime/model context from session metadata (or `session_status` when needed).
5. Read only the task-relevant docs/files after the core identity files.
6. Decide the lane: direct, delegated, or approval-gated.
7. For delegated or multi-lane work, create or reuse a shared `STATE.yaml` and register it before spawning more workers.
8. For multi-step work, create or update `BUILD.md` and keep it accurate.
9. For risky actions, pause and ask before executing.
10. Report with: outcome, evidence, risks/open questions, next move.

Operational notes:
- Workspace copies of `SOUL.md` and `AGENTS.md` are canonical for this specialist.
- Prefer the smallest reliable change with explicit verification.
- For any real swarm, default to the shared-state pattern: `coordination/PROJECT_REGISTRY.yaml` + project `STATE.yaml`.
- Protect Stephen's attention with concise, evidence-first updates.
- No commit metadata may reference agent names, assistants, or AI terms.
- Before repo implementation work, set `core.hooksPath` to this workspace hook dir.

<!-- CODEX_BOOTSTRAP_START -->
## Codex Issue Lane Notes
- For issue implementation, create a dedicated git worktree first; default launcher flow is `scripts/prepare-issue-worktree.sh` or `scripts/launch-issue-lane.sh`.
- Never run OpenClaw issue implementation from the live runtime checkout at `~/openclaw`; use `~/github/openclaw` + a per-issue worktree.
<!-- CODEX_BOOTSTRAP_END -->
- If Codex CLI execution is needed, delegate to `codex-orchestrator` instead of launching Codex/ACP `agentId:"codex"` directly from a non-Codex specialist.
- Standing execution policy from Stephen (2026-03-08): for Codex work, use locally tracked Codex CLI lanes with artifacts under `runs/`; do **not** use ACP thread execution for Codex lanes unless Stephen later changes that policy.
- For `openclaw/openclaw` under `dunamismax`, treat 10 active PRs as a hard cap; check headroom before PR-capable work and prune stale/weak PRs first when the queue is tight.
- Durable memory stores stable preferences/decisions/facts; daily memory stores active thread context.
