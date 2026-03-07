# CONTRIBUTING_TO_OPENCLAW.md

Purpose: make `openclaw-maintainer` fast, disciplined, and boring-in-a-good-way when working on `~/github/forks/openclaw`.

This file is a maintainer-local runbook, not an upstream policy document. When it conflicts with upstream repo docs, read the upstream docs first and then use this file for Stephen-specific operating discipline.

## Source of truth order

1. Active user request
2. OpenClaw repo docs in the checked-out repo (`README`, `CONTRIBUTING`, relevant docs under `docs/`)
3. The target issue / PR / failing test / code comments
4. This runbook
5. General workspace defaults

Do not skip repo docs and guess.

## Repo boundaries

- **Live install:** `~/openclaw` — inspect, read docs, and compare behavior here, but do not implement contribution work here.
- **Contribution clone:** `~/github/forks/openclaw` — canonical fork for coding and git operations.
- **Fix worktree:** `/tmp/openclaw-fix-<issue-or-topic>` — do implementation here, not in the main fork checkout.

If a task would modify OpenClaw code, default to this sequence:
1. Sync `~/github/forks/openclaw` with `upstream/main`.
2. Create a fresh worktree under `/tmp/openclaw-fix-<issue-or-topic>`.
3. Implement and verify in the worktree.
4. Commit and push from the worktree.

Avoid avoidable churn:
- No drive-by formatting outside the touched scope.
- No opportunistic refactors unless they unblock the fix.
- No edits in the live install to “just test something quickly” and forget.

## Operating modes

### Triage mode

Use when asked to scan issues or propose work.

- Sync first.
- Check recent issues first (default last 10 days unless asked otherwise).
- Skip issues with an open PR, active assignee, or already-landed fix.
- Prefer bugs, regressions, scoped features, and areas where local context exists.
- Produce ranked candidates with a suggested minimal fix path.
- Do **not** implement in triage mode.

### Implementation mode

Use when fixing a specific issue.

- Start with the issue, recent comments, and relevant local docs.
- Reproduce or find concrete evidence before changing code where feasible.
- Prefer the smallest correct fix.
- Keep the patch focused enough that upstream review is easy.
- Run the smallest verification set that proves the change.
- Prepare a PR-quality explanation: what broke, why, what changed, and what verified it.

Do **not** use implementation sessions to browse unrelated issues.

## Local-doc-first diagnosis sequence

Before touching code, read only the docs that matter:

1. `CONTRIBUTING.md`
2. `README.md` or the closest subsystem doc
3. relevant files under `docs/`
4. `package.json` scripts for the actual verification commands
5. tests covering the affected area
6. implementation files

For OpenClaw specifically:
- trust repo scripts over memory
- trust local docs over stale assumptions
- trust tests and current code over both

If a command, file path, or subsystem rule is uncertain, verify it locally before asserting it.

## Verification discipline

Do not claim “fixed” because the patch looks plausible.

Minimum expectations:
- Run formatting/lint/type/test commands that match the scope when available.
- If full repo verification is too expensive, run the smallest convincing subset and say exactly what was skipped.
- For docs-only changes, check link/lint commands if relevant or explicitly mark verification as manual.
- For bug fixes, prefer either a targeted regression test or a clearly documented reproduction/behavior check.

Useful OpenClaw commands from the repo today:
- `pnpm format:check`
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- targeted `pnpm test:*` or `vitest` configs from `package.json`
- `pnpm check` when touching broader invariants or policy-sensitive paths

Never invent a verification run. If it did not execute, say so.

## PR quality bar

A contribution is upstream-ready when it is:
- focused on one concern
- grounded in current repo behavior
- explained in reviewer language, not agent language
- backed by concrete verification
- free of unrelated churn

PR/package expectations:
- Describe the bug or gap in one sentence.
- Explain the smallest change that fixes it.
- Call out tests or manual verification actually performed.
- Mention any known residual risk.
- Include before/after screenshots for UI-visible changes when applicable.

## Git and attribution hygiene

- Never include AI/agent attribution in commits, branches, PR titles, or commit trailers.
- Keep commits atomic.
- Use Stephen’s git identity.
- Before implementation work in a repo, ensure `core.hooksPath` points at the workspace hook directory if that setup is part of the current environment.

## Escalation boundaries

Pause and ask Stephen before:
- schema or storage changes with migration risk
- security-sensitive behavior changes without a clear reproduction
- broad refactors to clean up “while we’re here”
- changing user-facing defaults or config semantics
- risky live-environment operations

Act without asking for:
- documentation reads
- scoped code reads
- small focused fixes with clear verification
- tests, lint, formatting, and worktree setup

## Specialist bench coordination

Pull in another specialist only when specialization materially improves outcome.

Good handoff cases:
- security-heavy review → `sentinel`
- independent quality pass → `reviewer`
- mobile-specific OpenClaw app work → `builder-mobile`

Keep `openclaw-maintainer` as the owner of repo context, contribution hygiene, and final integration judgment.

## Definition of done

Done means:
- repo docs were consulted first
- work happened in the fork/worktree, not the live install
- the patch is minimal and readable
- verification was actually run or explicitly scoped out
- the handoff/PR summary is reviewer-grade
- no AI attribution leaked into git metadata
