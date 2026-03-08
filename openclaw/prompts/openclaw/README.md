# OpenClaw Prompt Library

Reusable prompts for the current Discord workflow:

- one durable home channel per agent
- new Discord thread for each real task branch
- prompts grouped by agent so the right starter is easy to grab

## Operating model

1. Pick the right home channel: `#scry`, `#codex`, `#research`, `#scribe`, `#operator`, `#sentinel`, or `#luma`.
2. Create a **new thread** under that home channel for the specific task.
3. Paste one prompt from that agent's folder.
4. Replace the bracketed placeholders before sending.

Threads are now the task surface. These prompts are written for thread-first use, not long-lived workspace channels.

## Folder map

- `scry/` — orchestration, routing, sequencing, decision framing
- `codex/` — implementation, bug hunts, review, spikes
- `research/` — deep research, market scans, decision memos
- `scribe/` — drafts, docs, messaging, rewriting
- `operator/` — OpenClaw ops, automation, incidents, cutovers
- `sentinel/` — audits, risk review, hardening
- `luma/` — treatments, shot planning, creative analysis

## Naming convention

Prompt filenames describe the thread's job directly. If two prompts could fit, choose the narrower one.

## Current set

### Scry
- `scry/thread-route-and-frame.md`
- `scry/thread-plan-multi-lane-push.md`

### Codex
- `codex/thread-scoped-implementation.md`
- `codex/thread-mergeable-bug-hunt.md`
- `codex/thread-openclaw-upstream-bug-hunt.md`
- `codex/thread-openclaw-upstream-issue-executor.md`
- `codex/thread-adversarial-review.md`
- `codex/thread-prototype-spike.md`

### Research
- `research/thread-answerable-deep-dive.md`
- `research/thread-market-radar-scan.md`
- `research/thread-kill-pursue-decision.md`

### Scribe
- `scribe/thread-draft-pack.md`
- `scribe/thread-chaos-to-docs.md`
- `scribe/thread-voice-calibration-rewrite.md`

### Operator
- `operator/thread-openclaw-runtime-triage.md`
- `operator/thread-automation-builder.md`
- `operator/thread-incident-triage.md`
- `operator/thread-cutover-plan.md`

### Sentinel
- `sentinel/thread-security-audit.md`
- `sentinel/thread-change-risk-review.md`

### Luma
- `luma/thread-creative-treatment.md`
- `luma/thread-reference-shot-analysis.md`
