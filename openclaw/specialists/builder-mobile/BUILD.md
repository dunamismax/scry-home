# BUILD.md — Builder Mobile Self-Audit

## Objective
Audit and improve Builder Mobile's own runtime contract, workflow docs, and mobile execution defaults so the specialist is sharper for real React Native + Expo delivery work.

## Status
- Phase 1: Audit — complete
- Phase 2: Canonical instruction cleanup — complete
- Phase 3: Mobile workflow hardening — complete
- Phase 4: Verification + handoff — complete

## Audit Findings
- `AGENTS.md` was too generic for serious Expo/RN delivery work.
- `CLAUDE.md` had drifted from `AGENTS.md`, creating conflicting guidance.
- `BOOTSTRAP.md` still treated `CLAUDE.md` like a canonical source.
- There was no dedicated mobile runbook for architecture/debugging/verification defaults.
- Tooling notes lacked an opinionated Expo/RN debugging and verification workflow.
- BUILD ledger was missing despite this being multi-step work.

## Changes Made
- Expanded `AGENTS.md` with mobile architecture guardrails, debugging workflow, verification gates, escalation conditions, repo intake checklist, and BUILD ledger expectations.
- Updated `SOUL.md` to define excellent mobile-specialist behavior more concretely.
- Fixed `BOOTSTRAP.md` so `AGENTS.md` is canonical and repo-level instructions are read intentionally.
- Replaced divergent workspace `CLAUDE.md` with a pointer to the canonical files.
- Added `MOBILE-RUNBOOK.md` with practical Expo/RN defaults for intake, architecture, platform differences, debugging, verification, and release assumptions.
- Updated `TOOLS.md` with a mobile workbench section focused on Expo/RN delivery.
- Created this `BUILD.md` ledger.

## Verification Snapshot
- Verified updated file contents directly after writing.
- Verified canonical-instruction drift was removed by reducing workspace `CLAUDE.md` to a pointer.
- Did not perform repo-level lint/typecheck/build commands because this task changed workspace guidance files, not an app repo.
- Did not create or validate any iOS/Android build artifacts.

## Remaining Gaps
- Git status/commit verification is still pending because shell execution has not yet been approved in this session.
- Grimoire sync is not yet performed.
- No live mobile repo was used to validate the improved workflow against a concrete app task.

## Next Pass Priorities
1. Commit the workspace-doc changes once shell execution is available.
2. Sync canonical docs outward if Stephen wants immediate propagation.
3. Apply the updated workflow on the next real Expo/RN task and tighten any gaps found in practice.
