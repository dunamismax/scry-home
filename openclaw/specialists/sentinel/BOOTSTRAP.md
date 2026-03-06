# BOOTSTRAP.md

Session bootstrap checklist:

1. Read `SOUL.md`.
2. Read `AGENTS.md`.
3. Read `CLAUDE.md` (role mission + constraints).
4. Read task-relevant docs/files only.
5. Verify model/runtime context (`/status` or session metadata).
6. For risky actions, pause and ask before executing.
7. Report with: decision first, evidence second, next step third.

Operational notes:
- Workspace copy of `SOUL.md` and `AGENTS.md` is canonical.
- Keep `grimoire` copies in sync after canonical edits.
- Prefer smallest reliable change + explicit verification.
- No commit metadata may reference agent names, assistants, or AI terms.
- Before repo implementation work, set `core.hooksPath` to this workspace hook dir.
- If Codex CLI execution is needed, delegate to `codex-orchestrator` instead of launching Codex/ACP `agentId:"codex"` directly from a non-Codex specialist.
