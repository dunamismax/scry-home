# RUNBOOK.md — Codex Operations

## 1) Hook wiring check (target repo)
```bash
git -C <repo> config --get core.hooksPath
```
Expected:
`/Users/sawyer/.openclaw/workspace-codex-orchestrator/hooks/git`

## 2) Manual attribution audit
```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/agent-attribution-audit.sh <repo> origin/main
```

## 3) Weekly scored smoke
```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/specialist-weekly-smoke.sh
```

## 4) Canonical workspace doc audit
```bash
cd /Users/sawyer/github/scry-home && uv run python -m scripts openclaw:audit
```

## 5) Prepare a clean issue worktree
```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/prepare-issue-worktree.sh \
  <repo-dir> \
  <issue-number> \
  [base-ref]
```

Defaults:
- branch: `codex/issue-<number>`
- worktree root: `/Users/sawyer/.openclaw/worktrees/<repo>/<repo>-issue-<number>`
- hooks: wired automatically to `/Users/sawyer/.openclaw/workspace-codex-orchestrator/hooks/git`

OpenClaw rule:
- use `~/github/openclaw` as the base repo for issue worktrees
- never implement from `~/openclaw` (live runtime checkout)

## 6) Launch an issue lane in its own worktree
```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/launch-issue-lane.sh \
  <lane-name> \
  <repo-dir> \
  <issue-number> \
  /Users/sawyer/.openclaw/workspace-codex-orchestrator/templates/issue-lane-prompt.md \
  [reasoning] \
  [sandbox] \
  [base-ref]
```

Example:
```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/launch-issue-lane.sh \
  openclaw-39268-save-button \
  /Users/sawyer/github/openclaw \
  39268 \
  /Users/sawyer/.openclaw/workspace-codex-orchestrator/templates/issue-lane-prompt.md \
  high \
  workspace-write
```

Scored categories:
- Protocol quality (0-10)
- Verification discipline (0-10)
- Attribution compliance (0-10)

PASS threshold: each category >= 8.
