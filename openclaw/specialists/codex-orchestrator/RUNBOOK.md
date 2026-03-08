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

Scored categories:

<!-- CODEX_RUNBOOK_START -->
## 5) Bootstrap a stateful project batch
```bash
python3 /Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/codex-batch.py init \
  <name> \
  --objective "<what done looks like>"
```

This creates:
- `runs/batches/<timestamp>-<slug>/manifest.json`
- `runs/batches/<timestamp>-<slug>/STATE.yaml`
- /updates an entry in `coordination/PROJECT_REGISTRY.yaml`

Useful follow-ups:
```bash
python3 /Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/codex-state.py summary <state-file>
python3 /Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/codex-state.py task-upsert <state-file> --id <task-id> --status in_progress --owner <owner>
```

## 6) Prepare a clean issue worktree
```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/prepare-issue-worktree.sh   <repo-dir>   <issue-number>   [base-ref]
```

Defaults:
- branch: `codex/issue-<number>`
- worktree root: `/Users/sawyer/.openclaw/worktrees/<repo>/<repo>-issue-<number>`
- hooks: wired automatically to `/Users/sawyer/.openclaw/workspace-codex-orchestrator/hooks/git`

OpenClaw rule:
- use `~/github/openclaw` as the base repo for issue worktrees
- never implement from `~/openclaw` (live runtime checkout)

## 7) Launch an issue lane in its own worktree
```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/launch-issue-lane.sh   <lane-name>   <repo-dir>   <issue-number>   /Users/sawyer/.openclaw/workspace-codex-orchestrator/templates/issue-lane-prompt.md   [reasoning]   [sandbox]   [base-ref]
```

Example:
```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/launch-issue-lane.sh   openclaw-39268-save-button   /Users/sawyer/github/openclaw   39268   /Users/sawyer/.openclaw/workspace-codex-orchestrator/templates/issue-lane-prompt.md   high   workspace-write
```
<!-- CODEX_RUNBOOK_END -->
- Protocol quality (0-10)
- Verification discipline (0-10)
- Attribution compliance (0-10)

PASS threshold: each category >= 8.
