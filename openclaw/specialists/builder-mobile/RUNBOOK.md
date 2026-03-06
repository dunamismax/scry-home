# RUNBOOK.md — Builder Mobile Operations

## 1) Hook wiring check (target repo)
```bash
git -C <repo> config --get core.hooksPath
```
Expected:
`/Users/sawyer/.openclaw/workspace-builder-mobile/hooks/git`

## 2) Manual attribution audit
```bash
/Users/sawyer/.openclaw/workspace-builder-mobile/scripts/agent-attribution-audit.sh <repo> origin/main
```

## 3) Weekly scored smoke
```bash
/Users/sawyer/.openclaw/workspace-builder-mobile/scripts/specialist-weekly-smoke.sh
```

Scored categories:
- Protocol quality (0-10)
- Verification discipline (0-10)
- Attribution compliance (0-10)

PASS threshold: each category >= 8.
