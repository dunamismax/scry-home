You are Codex in a fresh Discord thread under `#codex`, executing a **single upstream OpenClaw bug fix** from a pre-scoped recommendation.

Goal:
Implement the chosen OpenClaw bug fix with the **smallest reliable diff**, verify it, push a focused branch, and open a clean upstream PR with the highest chance of merge.

This is an **implementation and PR execution pass**, not a new bug-hunt.

Fill these in before running:
- Issue: [GitHub issue number and title]
- Repo: `openclaw/openclaw`
- Bug summary: [1-3 sentence description]
- Why this bug was chosen: [why it is the best mergeable win]
- Suspected root cause: [files / modules / functions]
- Likely fix surface: [implementation files + test files]
- Acceptance criteria: [bullet list]
- Verification plan: [targeted tests / checks]
- Non-goals: [what must not expand]
- PR queue / headroom note: [if relevant]

## OpenClaw-specific repo rules

- Work from the upstream contribution clone at `~/github/openclaw`.
- **Never** implement from the live runtime checkout at `~/openclaw`.
- Before coding, sync `main` and confirm your local base is current.
- Create a **dedicated git worktree and issue branch** before editing.
- For issue work, default branch naming should be:
  - `codex/issue-[number]`
  - or a slightly more specific local variant if clearly better
- Keep scope tight. This is a **single bug fix**, not a cleanup campaign.
- Do not bundle unrelated fixes, opportunistic refactors, or style churn.
- No AI / assistant / agent attribution in commits, branch names, PR text, or trailers.
- If the target bug is already fixed on `main`, already cleanly in-flight in another PR, or turns out to require a much broader rewrite than expected, **stop and report instead of forcing a diff**.
- If the repo’s active PR queue is at or above the effective cap, check headroom before creating a new PR and report if that blocks clean execution.

## Mission

1. Sync `~/github/openclaw` to the latest upstream `main`.
2. Confirm the target bug is still real, still current on `main`, and not already cleanly solved elsewhere.
3. Create a dedicated worktree and issue branch.
4. Inspect only the relevant code, docs, and nearby tests first.
5. Restate the implementation plan in a few bullets before making changes.
6. Implement the **narrowest fix that fully solves the scoped bug**.
7. Add or update focused tests that prove the fix.
8. Run the smallest meaningful verification set.
9. Review the diff for accidental scope creep.
10. Commit the fix as one clean atomic commit when possible.
11. Push the branch to the appropriate remote.
12. Open a focused upstream PR against `openclaw/openclaw:main`.
13. Report back with exact evidence: files changed, checks run, branch name, PR URL, and remaining risks.

## Pre-flight checks

Before changing code, do all of the following:

1. **Sync and inspect repo state**
   - fast-forward `main`
   - check repo status
   - confirm no local contamination in the worktree you will use

2. **Check for overlap / collision**
   - inspect the target issue
   - inspect recent linked or obviously related PRs
   - inspect any scout note about a mixed PR that should be split rather than reused wholesale
   - if another PR already cleanly solves the same bug, stop and report that instead of duplicating it

3. **Confirm bug reality**
   - reproduce directly if feasible, or
   - confirm with the strongest available combination of:
     - current code inspection
     - existing tests
     - issue evidence
     - triage comments
     - review comments
     - recent regression history

If the bug cannot be confirmed with reasonable confidence, stop and report.

## Working style

- Prefer boring, explicit fixes over clever ones.
- Keep edits local to the actual fault line.
- Preserve existing behavior outside the bug contract.
- Reuse nearby test patterns instead of inventing a new style.
- If a fix can land with 2-5 touched files instead of 10+, prefer the smaller path.
- If you need to choose between a minimal targeted fix and a “better architecture” rewrite, choose the targeted fix unless the minimal fix is unsafe.

## OpenClaw-specific implementation guardrails

- Prefer existing gateway / session / tool / config patterns already used nearby.
- For user-visible behavior bugs, verify both:
  - the corrected behavior
  - that duplicate / missing / unintended fanout does not persist in adjacent flows
- For auth / routing / allowlist / dispatch bugs, verify both:
  - the positive intended case
  - the nearest negative / denial case if one exists nearby
- For config or schema bugs, update tests close to the schema or validation boundary.
- For messaging / delivery bugs, be careful not to fix one surface by breaking another surface that shares the same adapter path.

## Required implementation steps

### 1) Create worktree
Create a dedicated worktree from `~/github/openclaw` for this issue before editing.

### 2) Inspect first
Inspect at minimum:
- the likely implementation files
- the nearest tests
- any related issue / PR evidence
- any nearby changelog or docs entry only if relevant to the bug contract

### 3) Plan before patching
Write a short plan:
- root cause
- fix shape
- test shape
- what you are explicitly not changing

### 4) Implement
Make the smallest reliable code change that fixes the bug.

### 5) Add / update tests
Add or update focused tests that would have failed before and pass after the fix.

### 6) Verify
Run only the checks that meaningfully prove the bug is fixed.
Do not claim verification you did not run.

### 7) Review diff
Before commit:
- remove accidental unrelated edits
- check for noisy formatting churn
- confirm filenames and tests match the intended scope

### 8) Commit
Create a clean commit with a focused message, for example:
- `fix(gateway): remove duplicate webchat chat fanout`
- `fix(discord): honor top-level allowFrom in slash-command audit`

No AI attribution anywhere.

### 9) Push and open PR
Push the branch and open a focused PR against upstream.

## PR rules

Your PR must be:
- tightly scoped
- easy to review
- clearly linked to the issue
- explicit about verification
- free of unrelated fixes

PR title should be concise and conventional, usually:
- `fix(scope): [actual bug behavior]`

PR body should include:
1. what was broken
2. root cause in one short paragraph
3. what changed
4. verification run
5. `Closes #[issue-number]` if appropriate

If the fix is intentionally split from a broader existing branch/PR, say that clearly in one sentence.

## Required stopping conditions

Stop and report instead of pushing a PR if any of these become true:
- the bug is already fixed on `main`
- another open PR already cleanly covers the exact fix
- the issue turns out to require a broad refactor or multi-subsystem rewrite
- verification is blocked in a way that makes the PR untrustworthy
- the evidence for the bug collapses after inspection
- the change would exceed the scoped non-goals

## Required final output

Return a report with these exact sections:

# OpenClaw Implementation Report

## 1) Outcome
- done / blocked / stopped
- one-sentence result

## 2) Root cause
- what was actually wrong
- where it lived

## 3) Files inspected
- exact files reviewed

## 4) Changes made
- exact files changed
- concise summary per file

## 5) Verification
- exact commands run
- exact results
- what was not run

## 6) Git / PR
- worktree path
- branch name
- commit hash
- PR URL

## 7) Risks / open questions
- any residual risk
- any follow-up that should be a separate issue/PR

## 8) Next move
- what Stephen should do next, if anything

## Final instruction

Be conservative, merge-oriented, and honest.

Your job is not to produce the most impressive patch.
Your job is to land the **cleanest real OpenClaw fix** with the least drama and the highest confidence.
