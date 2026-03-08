# OpenClaw Prompt Library

Reusable starter prompts for the current Discord workflow:

- one durable home channel per agent
- one new Discord thread per real task
- one sharp prompt to start the thread on purpose

This pack is meant to be used daily. The point is not prompt volume. The point is clean starts, better routing, and less thread drift.

Need the short pinned version? Use `DISCORD_PINNED_QUICKSTART.md`.

## Thread-first operating model

1. Pick the right home channel: `#scry`, `#codex`, `#research`, `#scribe`, `#operator`, `#sentinel`, or `#luma`.
2. Create a **new thread** under that home channel for the task.
3. Choose the **narrowest prompt** that matches the job.
4. Replace the bracketed placeholders before sending.
5. If the task changes shape, start a new thread instead of stuffing a second ask into the first one.

These prompts assume threads are the task surface. They do **not** assume durable workspace channels.

## Quick chooser

| If you need to… | Start here |
|---|---|
| Route a new ask and pick the right lane | `scry/thread-route-and-frame.md` |
| Break a larger push into phases and handoffs | `scry/thread-plan-multi-lane-push.md` |
| Frame an OpenClaw upstream contribution or PR strategy | `scry/thread-openclaw-upstream-pr-strategy.md` |
| Implement a scoped feature/fix/refactor | `codex/thread-scoped-implementation.md` |
| Find one good bug and fix it | `codex/thread-mergeable-bug-hunt.md` |
| Land one OpenClaw upstream fix with maintainer-friendly scope | `codex/thread-openclaw-upstream-mergeable-fix.md` |
| Tighten an existing OpenClaw upstream PR | `codex/thread-openclaw-upstream-pr-polish.md` |
| Pressure-test a diff before it ships | `codex/thread-adversarial-review.md` |
| Run a timeboxed spike | `codex/thread-prototype-spike.md` |
| Produce a sourced answer memo | `research/thread-answerable-deep-dive.md` |
| Scan OpenClaw issues / maintainer signals before coding | `research/thread-openclaw-upstream-issue-radar.md` |
| Make a kill / pursue / park call | `research/thread-kill-pursue-decision.md` |
| Draft or rewrite something fast | `scribe/thread-draft-pack.md` |
| Turn rough material into durable docs | `scribe/thread-chaos-to-docs.md` |
| Triage OpenClaw runtime or config trouble | `operator/thread-openclaw-runtime-triage.md` |
| Review change risk or run a security audit | `sentinel/thread-change-risk-review.md`, `sentinel/thread-security-audit.md` |
| Build a treatment or decode a reference | `luma/thread-creative-treatment.md`, `luma/thread-reference-shot-analysis.md` |

## Recommended OpenClaw upstream flow

For `openclaw/openclaw` contribution work, the default sequence is:

1. `research/thread-openclaw-upstream-issue-radar.md` — find the best opening with receipts.
2. `scry/thread-openclaw-upstream-pr-strategy.md` — choose the lane, scope, and merge plan.
3. `codex/thread-openclaw-upstream-mergeable-fix.md` — implement the fix cleanly.
4. `codex/thread-openclaw-upstream-pr-polish.md` — use when an existing PR needs tightening rather than new implementation.

That flow keeps issue selection, strategy, and execution from bleeding into one fuzzy thread.

## Folder map

- `scry/` — orchestration, routing, sequencing, upstream contribution framing
- `codex/` — implementation, bug hunts, review, spikes, upstream PR execution/polish
- `research/` — deep research, issue-radar work, decision memos, market scans
- `scribe/` — drafting, docs, rewriting, voice cleanup
- `operator/` — OpenClaw ops, automation, incidents, cutovers
- `sentinel/` — audits, risk review, hardening
- `luma/` — treatments, shot planning, creative analysis

## Naming rules

- `thread-...` means the prompt is written for a fresh task thread under the matching home channel.
- Prefer the narrower prompt when two could fit.
- If you are adding a new prompt later, name the job directly. Avoid clever names.

## Current prompt index

### Scry
- `scry/thread-route-and-frame.md` — choose the lane and write the next starter prompt
- `scry/thread-plan-multi-lane-push.md` — sequence a larger push across phases or specialists
- `scry/thread-openclaw-upstream-pr-strategy.md` — frame an OpenClaw upstream contribution or PR plan

### Codex
- `codex/thread-scoped-implementation.md` — land one verified implementation
- `codex/thread-mergeable-bug-hunt.md` — find and fix one strong bug candidate
- `codex/thread-openclaw-upstream-mergeable-fix.md` — select and ship one mergeable OpenClaw upstream fix
- `codex/thread-openclaw-upstream-pr-polish.md` — tighten an existing OpenClaw PR for mergeability
- `codex/thread-adversarial-review.md` — review a diff hard before it ships
- `codex/thread-prototype-spike.md` — timeboxed spike for the hard unknown

### Research
- `research/thread-answerable-deep-dive.md` — answer-first research memo with sources
- `research/thread-openclaw-upstream-issue-radar.md` — scan OpenClaw issues, regressions, and maintainer signals
- `research/thread-market-radar-scan.md` — fast market structure and wedge scan
- `research/thread-kill-pursue-decision.md` — force a kill / pursue / park call

### Scribe
- `scribe/thread-draft-pack.md` — fast first drafts with a recommended version
- `scribe/thread-chaos-to-docs.md` — convert rough material into usable docs
- `scribe/thread-voice-calibration-rewrite.md` — rewrite copy in a sharper voice

### Operator
- `operator/thread-openclaw-runtime-triage.md` — diagnose OpenClaw runtime/config/channel issues
- `operator/thread-automation-builder.md` — design or implement boring, recoverable automation
- `operator/thread-incident-triage.md` — contain and narrow an incident
- `operator/thread-cutover-plan.md` — plan a reversible cutover

### Sentinel
- `sentinel/thread-security-audit.md` — practical audit and hardening priority list
- `sentinel/thread-change-risk-review.md` — judge whether a proposed change is safe to proceed

### Luma
- `luma/thread-creative-treatment.md` — shape a visual concept into a usable treatment
- `luma/thread-reference-shot-analysis.md` — decode a reference and recreate the look
