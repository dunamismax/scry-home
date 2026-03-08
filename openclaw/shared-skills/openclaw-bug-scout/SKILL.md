---
name: openclaw-bug-scout
description: Scout the OpenClaw repo for the single best small, mergeable bug to fix next. Use when asked to find the best OpenClaw upstream bug win, review recent issues or PR comments for a conservative fix target, inspect recent regressions or flaky areas, or produce a codex-orchestrator-ready handoff for one narrowly scoped bug fix. Do not use when the task is to implement the fix directly.
---

# OpenClaw Bug Scout

Work in conservative bug-hunt mode for the OpenClaw repo.

## Objective

Find the **single best bug to fix next** if the priority is:

- real user-facing or clearly valid engineering pain
- small-to-medium scope
- high confidence
- fast verification
- high chance of clean review and merge

This is not a “find the most interesting problem” pass.
This is a “find the best mergeable bug win” pass.

## Repo handling

- Default to `~/github/openclaw` unless the user explicitly names another OpenClaw checkout or you are already operating inside one.
- Sync/fetch latest repo state before scouting **only if** doing so is safe for the working tree.
- If the checkout is dirty or syncing would be risky, do **not** disturb it; inspect the current state and explicitly note that limitation in the report.

## Mission

1. Review recent issues, recent PR comments, recent regressions, and recent flaky or problematic areas.
2. Identify the **one** bug candidate most likely to become a clean, merged fix quickly.
3. Produce a full handoff report for implementation afterward.
4. **Scout only**. Do **not** implement the fix. Do **not** open PRs.

## Operating rules

- Do **not** choose broad refactors, architectural cleanups, or vague quality projects.
- Avoid giant platform migrations, sweeping infra churn, or speculative “could be wrong” investigations.
- Prefer:
  - confirmed bugs
  - recent bugs with active maintainer interest
  - review comments that clearly point to missing or faulty behavior
  - regressions with narrow fix surfaces
  - issues with existing or obvious tests nearby
  - bugs that can be proven fixed with targeted verification
- Strongly avoid:
  - giant multi-system bugs
  - issues requiring product decisions first
  - low-signal “maybe broken” reports
  - anything likely to turn into a rewrite
  - stale issues with unclear current relevance
  - bugs already obviously being worked by someone else

## Selection rubric

Choose the winner based on:

1. mergeability
2. confidence the bug is real
3. scope containment
4. user or reviewer value
5. ease of verification
6. low regression risk

If a bug is high impact but messy, ambiguous, or likely to sprawl, it should usually lose to a smaller, cleaner, more mergeable fix.

## What to investigate

Look at:

- recent open issues
- recent PR review comments
- recently merged PRs with possible fallout
- failing or flaky test areas
- obvious regressions in active subsystems
- hotspots where maintainers are already asking for follow-up

Prioritize likely wins in areas like:

- session routing
- command dispatch
- model or config resolution
- tool behavior
- auth or profile handling
- messaging edge cases
- onboarding or config bugs
- narrow test regressions

## Research approach

- Prefer concrete evidence from local code, tests, recent commits, issue threads, PR comments, and CI signals.
- Use the lightest useful checks. Do not turn scouting into an implementation pass.
- If GitHub tooling is available, use it for recent issues, PR comments, and review context.
- Inspect nearby files and tests before making claims about fix surface or verification.
- If direct reproduction is not practical, say so plainly and rely on the strongest code, review, or test evidence available.

## Required output

Return a report with these **exact sections**:

# Top Mergeable Bug Recommendation

## 1) Recommended bug
- title
- issue/PR link(s) if any
- one-sentence summary
- why this is the best fast mergeable win

## 2) Why this should win
Explain specifically why this bug beats larger or flashier candidates.

## 3) Top other candidates considered
List 3-5 other candidates.
For each:
- short title
- why it matters
- why it lost to the winner

## 4) Evidence
- exact issues / PRs / comments inspected
- exact files inspected
- exact tests / signals reviewed
- only concrete observations

## 5) Current behavior
Describe the bug as it exists now.

## 6) Expected behavior
Describe the correct behavior.

## 7) Reproduction or proof
If directly reproducible:
- exact repro steps
- observed result
- expected result

If not directly reproducible:
- explicitly say that
- provide the strongest code/test/review evidence that the bug is still real

## 8) Why this looks mergeable
Cover:
- likely scope size
- likely number of files touched
- whether tests likely already exist nearby
- whether acceptance criteria are clear
- why this should be a clean review

## 9) Suspected root cause
- likely files/functions/modules
- why they are implicated

## 10) Likely fix surface
List the probable implementation files and probable test files.

## 11) Acceptance criteria
Write a concrete checklist that would prove the bug is fixed.

## 12) Suggested verification
List the smallest meaningful checks/tests to run after implementation.

## 13) Orchestrator-ready implementation brief
Write a clean implementation prompt that:
- assumes zero prior context
- says exactly what bug to fix
- names the key files and tests to inspect
- includes acceptance criteria
- includes verification expectations
- says to implement and verify, not just analyze
- keeps scope tight and merge-oriented

## Decision standard

- Choose **exactly one** winner.
- Do **not** say “here are several good options.”
- Do **not** optimize for novelty.
- Optimize for the bug most likely to turn into a real merged fix soon.

## Final instruction

Be conservative, practical, and ruthless about scope.
Pick the bug you would personally want to hand to an implementation agent if your only goal was:

> land a real fix upstream with the least drama and the highest confidence
