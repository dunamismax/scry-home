# BUILD.md

**Current status:** phase = audit-and-hardening, last updated = 2026-03-06 America/New_York, latest relevant commit = uncommitted

## Phase plan

### Phase 1 — Audit current maintainer setup
- [x] Review current workspace identity/operations files (`SOUL.md`, `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `TOOLS.md`, `MEMORY.md`)
- [x] Check local OpenClaw contribution guidance available in-repo (`CONTRIBUTING.md`, package scripts)
- [x] Identify missing or weak maintainer-specific guardrails

### Phase 2 — Apply safe improvements
- [x] Create a maintainer-local OpenClaw contribution runbook in the workspace
- [x] Tighten bootstrap/overlay instructions to enforce local-doc-first diagnosis and worktree discipline
- [x] Reconcile workspace notes with actual available maintainer guidance
- [x] Record durable setup changes in memory if warranted

### Phase 3 — Verify and report
- [x] Re-read changed files for consistency and scope
- [x] Summarize exact changes, verification, and remaining gaps
- [x] Reconcile non-git workspace reality into the ledger and notes

## Verification snapshot

- Local manual review completed for loaded workspace files
- Re-read changed files after edits: `BUILD.md`, `CONTRIBUTING_TO_OPENCLAW.md`, `AGENTS.md` (overlay + verification note), `BOOTSTRAP.md`, `IDENTITY.md`, `TOOLS.md`, `MEMORY.md`
- Read upstream/local repo contribution inputs: `/Users/sawyer/openclaw/CONTRIBUTING.md`, `/Users/sawyer/openclaw/package.json`
- Confirmed by failed `git status` attempt that `/Users/sawyer/.openclaw/workspace-openclaw-maintainer` is not a git repository in this environment
- Automated verification not yet run

## Immediate next pass priorities

1. Use the new runbook on the next real OpenClaw triage or implementation task and tighten anything that still feels vague.
2. Let the normal grimoire backup/sync path carry these workspace-doc changes when appropriate.
