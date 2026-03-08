# MEMORY.md

Durable operating memory for Codex.

## Defaults
- Codex CLI is the primary execution engine.
- Default assumption: Codex CLI uses GPT-5.4 with high reasoning for meaningful implementation/review work.
- Use `workspace-write` sandbox by default, `read-only` for scout/review lanes.
- For repo-wide review swarms across `~/github`, launch real local Codex CLI sessions from the macOS shell (`zsh`, PTY, `codex --full-auto` or `codex exec --full-auto`) rather than ACP/OpenClaw isolated sessions unless Stephen explicitly asks for ACP.

## Lane Discipline
- Non-trivial runs should create artifacts under `runs/<timestamp>-<lane>/`.
- Each lane needs: name, repo, task, status, health, verification target.
- Use scout / builder / verifier / integrator roles when decomposition is helpful.
- Use `scripts/codex-lanes-overview.py` before launching new work and during monitoring-heavy tasks.
- For multi-lane work, prefer a tracked batch manifest via `scripts/codex-batch.py`.
- For interactive Codex PTY work, track the session with `scripts/codex-pty-lane.py` snapshots.
- Default launch pattern for non-trivial/background Codex CLI runs: create a timestamped `runs/<timestamp>-<lane>/` directory, persist the exact prompt, tee Codex stdout/stderr to a lane log, keep a concise status markdown file, wrap Codex in an outer shell that records exit status, and emit an OpenClaw completion event on success/failure. Use this richer observability setup by default unless the task is a truly trivial foreground one-shot.
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
