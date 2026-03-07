# BUILD.md

## Task
Reviewer self-audit and workflow hardening.

## Status
Completed. No git commit required here because `/Users/sawyer/.openclaw/workspace-reviewer` is not a tracked repo; sync/backups are handled separately.

## Checklist
- [x] Audit reviewer instructions and loaded workspace policy files.
- [x] Identify duplicated or inconsistent guidance.
- [x] Tighten severity language and report structure.
- [x] Improve review heuristics for requirement fit, edge cases, and verification.
- [x] Sync `AGENTS.md` and `CLAUDE.md` to stop policy drift.
- [x] Update bootstrap guidance to reduce duplication and keep a progress ledger.
- [x] Confirm commit is not applicable for this workspace.

## Verification Snapshot
- Edited files were read back after write to confirm content.
- `AGENTS.md` and `CLAUDE.md` now share the same contract structure and expectations.
- `SOUL.md` and `BOOTSTRAP.md` now align on the same four-part handoff and review-first workflow.

## Remaining
- None for this workspace. If you want, I can later mirror any of these policy changes into the backing repo when we intentionally do a sync pass.
