# MEMORY.md

Durable operating memory for Codex.

## Defaults
- Codex CLI is the primary execution engine.
- Default assumption: Codex CLI uses GPT-5.4 with high reasoning for meaningful implementation/review work.
- Use `workspace-write` sandbox by default, `read-only` for scout/review lanes.
- For repo-wide review swarms across `~/github`, launch real local Codex CLI sessions from the macOS shell (`zsh`, PTY, `codex --full-auto` or `codex exec --full-auto`).
- Standing rule from Stephen (2026-03-08): **never use ACP thread execution for Codex work.** For all Codex implementation/review/build lanes, use the real local Codex CLI via `exec` + PTY/background, track the lane under `runs/`, and prefer the existing lane launcher/monitoring scripts.
- Treat this as a durable operating policy, not a per-task preference. Do not route Codex work through `sessions_spawn runtime:"acp"` unless Stephen explicitly reverses this standing rule.

## Lane Discipline
- Non-trivial runs should create artifacts under `runs/<timestamp>-<lane>/`.
- Each lane needs: name, repo, task, status, health, verification target.
- Use scout / builder / verifier / integrator roles when decomposition is helpful.
- Use `scripts/codex-lanes-overview.py` before launching new work and during monitoring-heavy tasks.
- For multi-lane work, prefer a tracked batch manifest via `scripts/codex-batch.py`.
- For interactive Codex PTY work, track the session with `scripts/codex-pty-lane.py` snapshots.
- Default launch pattern for non-trivial/background Codex CLI runs: create a timestamped `runs/<timestamp>-<lane>/` directory, persist the exact prompt, tee Codex stdout/stderr to a lane log, keep a concise status markdown file, wrap Codex in an outer shell that records exit status, and emit an OpenClaw completion event on success/failure. Use this richer observability setup by default unless the task is a truly trivial foreground one-shot.
- New standing rule: for any real swarm, delegated PM, or tracked multi-step project, create or reuse a shared `STATE.yaml` and register it in `coordination/PROJECT_REGISTRY.yaml`; worker lanes should carry `stateFile` + `stateTaskId` when launched.
- Use `scripts/codex-watchdog.py` for stale/failed-only alert views.
- Keep prompts standardized with `templates/codex-lane-prompt.md` unless a task needs a sharper custom prompt.
- For implementation work on issues/PRs, use **one git worktree per issue lane**. Never point two implementation lanes at the same checkout.
- For OpenClaw upstream work, use the contribution clone at `~/github/openclaw`; never use the live runtime checkout at `~/openclaw` for issue implementation.
- Preferred launcher flow for issue work: `scripts/prepare-issue-worktree.sh` → `scripts/launch-issue-lane.sh` → `templates/issue-lane-prompt.md`.
- Branch naming default for issue lanes: `codex/issue-<number>` unless the repo already has a stronger local convention.

## Reporting
- Push updates proactively on launch, plan confirmation, midpoint, blockers, and completion.
- Report decision first, evidence second, next step third.

## Git Safety
- No AI attribution in commit metadata.
- Wire hooks before implementation work.
- Audit commits before push when branch commits exist.
