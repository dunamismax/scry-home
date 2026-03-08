# OpenClaw Prompt Quick Start

**One ask = one new thread** under the right home channel.
If the work changes shape, start a new thread instead of stuffing two jobs into one.

## Pick the right home channel

- **`#scry`** — routing, planning, sequencing, PR strategy, “what lane should this use?”
- **`#codex`** — implementation, bug fixes, reviews, spikes, PR polish
- **`#research`** — deep research, issue radar, maintainer/context scans, decision support
- **`#scribe`** — docs, drafts, rewrites, voice cleanup, messaging
- **`#operator`** — OpenClaw/runtime triage, automation, incidents, cutovers
- **`#sentinel`** — security audits, hardening, change-risk review
- **`#luma`** — creative treatments, shot planning, reference analysis

## Pick the narrowest prompt

Start with the closest fit from `prompts/openclaw/README.md`.
If two prompts could work, choose the narrower one.

## Fast defaults

- Unsure where to start? **`#scry` → `scry/thread-route-and-frame.md`**
- Bigger push with phases? **`#scry` → `scry/thread-plan-multi-lane-push.md`**
- Need code shipped? **`#codex` → `codex/thread-scoped-implementation.md`**
- Need one strong bug fix? **`#codex` → `codex/thread-mergeable-bug-hunt.md`**
- Need research with a real answer? **`#research` → `research/thread-answerable-deep-dive.md`**
- Need docs or writing? **`#scribe` → `scribe/thread-draft-pack.md`** or `scribe/thread-chaos-to-docs.md`
- Need OpenClaw ops help? **`#operator` → `operator/thread-openclaw-runtime-triage.md`**

## OpenClaw upstream shortcut

Default flow:
1. **`#research`** → `research/thread-openclaw-upstream-issue-radar.md`
2. **`#scry`** → `scry/thread-openclaw-upstream-pr-strategy.md`
3. **`#codex`** → `codex/thread-openclaw-upstream-mergeable-fix.md`
4. **`#codex`** → `codex/thread-openclaw-upstream-pr-polish.md` if an existing PR needs tightening

## Rule that saves the most pain

Do not use the home channels as long-running mixed-task chats.
Home channel = launch pad. Thread = actual work.