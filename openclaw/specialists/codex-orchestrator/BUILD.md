# BUILD.md

Status: **done** — issue-lane isolation pattern installed for codex-orchestrator; runtime config hardened with workspace-only FS tools.

## Phase plan
- [x] Inspect current OpenClaw concurrency/safety config and active session state
- [x] Choose the minimum safe runtime config change to reduce cross-lane collisions
- [x] Encode durable Codex policy for worktree-per-issue in workspace docs/memory
- [x] Add reusable worktree/lane launch helpers and prompt template
- [x] Validate the new helpers against a disposable git repo
- [x] Apply the runtime config patch and restart cleanly

## Acceptance checks / validation commands
- `bash -n scripts/prepare-issue-worktree.sh`
- `bash -n scripts/launch-issue-lane.sh`
- disposable functional test for `scripts/prepare-issue-worktree.sh` (temp git repo, branch/worktree/hooks assertions)
- `gateway config.patch` → `tools.fs.workspaceOnly = true`
- gateway restart confirmation in patch result

## Verification snapshot
- Added `scripts/prepare-issue-worktree.sh` to create/reuse one worktree per issue with default branch `codex/issue-<number>`.
- Added `scripts/launch-issue-lane.sh` to force issue lanes through the worktree-prep step before Codex runs.
- Added `templates/issue-lane-prompt.md` with explicit single-issue/single-worktree scope rules.
- Updated durable knowledge in `AGENTS.md`, `CLAUDE.md`, `BOOTSTRAP.md`, `MEMORY.md`, `TOOLS.md`, `RUNBOOK.md`, and `memory/2026-03-07.md`.
- Functional test passed against a disposable temp repo: branch creation, worktree creation, and hooks wiring all verified.
- Applied runtime config patch: `tools.fs.workspaceOnly = true`; gateway accepted patch and restarted via `SIGUSR1`.

## Immediate next-pass priorities
1. Use `scripts/launch-issue-lane.sh` for the next real OpenClaw issue implementation lane.
2. If needed later, add a lane registry check that warns when two active lanes point at the same repo checkout.

## Blockers / pending decisions
- Workspace is not a git repo, so there is no local workspace commit to create here.
