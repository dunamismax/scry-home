[Issue lane context]
- Issue: #<number> — <title>
- Repo: <absolute contribution clone path>
- Worktree: <absolute worktree path created for this issue>
- Base ref: <origin/main or other explicit base>
- Relevant files: <paths>
- Existing branch: <branch name>

[Coordination]
- State file: <absolute STATE.yaml path or none>
- Task id: <task-id or none>
- Owner label: <pm/worker label>
- If a `STATE.yaml` is provided, read it first and keep the issue task current.
- Record blocked state there before stopping.

Task:
Implement the smallest mergeable fix for this single issue only.

Hard scope boundaries:
- This lane owns exactly one issue and exactly one worktree.
- Do not change files outside this worktree.
- Do not broaden into adjacent cleanup/refactor work.
- Do not switch repos, branches, or worktrees.
- If another issue is discovered, note it and stop.

Execution policy:
- Read local repo docs/files first.
- Keep diffs narrow and reviewable.
- Match existing code style and test style.
- Prefer targeted tests before broader suites.
- If the bug is not reproducible, prove the fix with code-path and regression-test evidence.

Verification:
- Run the smallest meaningful checks that prove the bug is fixed.
- Report exact commands run.
- Report exact outcomes.
- Call out anything not verified.

Git / hygiene:
- No AI attribution.
- No assistant names in commit metadata.
- Keep branch atomic and issue-scoped.
- Never touch the live runtime checkout (`~/openclaw`) for OpenClaw issue work; use the contribution clone / worktree only.

When finished:
- update `STATE.yaml` with final status/output/blockers if one is in scope,
- summarize touched files,
- summarize the root cause,
- report exact verification,
- list residual risks or skipped checks.
