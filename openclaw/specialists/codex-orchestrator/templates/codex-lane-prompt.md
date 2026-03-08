[Repo context]
- Repo: <absolute repo path>
- Relevant files: <paths>
- Current state: <what exists / what is broken>

[Coordination]
- State file: <absolute STATE.yaml path or none>
- Task id: <task-id or none>
- Owner label: <pm/worker label>
- Before substantive work, read `STATE.yaml` if provided.
- Update your task there when you start, when blocked, and when finished.
- Use `next_actions` for concrete handoffs, not vague notes.

Task: <specific deliverable>

Requirements:
- <behavior requirement>
- <constraint>
- Keep changes scoped to this lane only.

Documentation lookup policy:
- Read local repo docs/files first for repo-specific behavior.
- Use Context7 first for current external docs and patterns.
- Use web search only if Context7 is missing or stale.

Verification:
- Run: <exact commands>
- Report exact outcomes, not summaries.

Git / hygiene:
- No AI attribution.
- No assistant names in commit metadata.
- Follow existing repo patterns.
- If the task is ambiguous, resolve with the smallest reliable change.

When finished:
- update `STATE.yaml` with final status/output/blockers if one is in scope,
- summarize touched files,
- report exact verification,
- call out any unresolved risk or unverified area.
