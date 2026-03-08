# BUILD.md

Status: done — scout-only bug-hunt pass selected one conservative upstream OpenClaw bug winner for implementation handoff.

## Phase plan
- [x] Read core instructions and select GitHub/repo scout lane
- [x] Sync `~/github/openclaw` to latest `origin/main`
- [x] Inspect recent open issues for narrow, current bug candidates
- [x] Inspect recent open/merged PRs and review comments for in-flight overlap or fallout
- [x] Verify shortlist against local `main` code and schema/tests
- [x] Choose exactly one winner and draft implementation handoff prompt
- [x] Deliver scout report with evidence, risks, and verification guidance

## Acceptance checks / validation commands
- `git -C ~/github/openclaw checkout main && git -C ~/github/openclaw pull --ff-only origin main`
- `gh issue list --repo openclaw/openclaw --state open --limit 30 --json number,title,labels,updatedAt,createdAt,author,url`
- `gh pr list --repo openclaw/openclaw --state open --limit 20 --json number,title,updatedAt,createdAt,author,url,reviewDecision,isDraft,labels`
- `gh pr list --repo openclaw/openclaw --state merged --limit 20 --json number,title,mergedAt,author,url,labels`
- `node --import tsx --input-type=module` scripts against `src/config/schema.ts` + `ui/src/ui/views/config-form.analyze.ts` to confirm unsupported agent-schema paths on current `main`
- `rg -n "Unsupported schema node|Form view can't safely edit some fields" ui/src/ui`

## Verification snapshot
- Repo synced cleanly to current `origin/main`
- Ruled out several recent issues because they already have linked PRs or explicit in-flight claims
- Local schema analysis on current `main` confirms `agents` config remains form-unsafe in Control UI (`agents.list` unsupported; `defaults.model`, `defaults.imageModel`, `defaults.pdfModel`, `defaults.subagents.model`, `defaults.sandbox.docker.setupCommand`, `defaults.sandbox.docker.ulimits` also unsupported)
- UI code still renders the exact warning/error strings reported in issue #39380
- Nearby analyzer + browser tests exist, making the likely fix surface narrow and reviewable

## Immediate next-pass priorities
- Hand implementation to a fresh Codex instance in a dedicated OpenClaw worktree
- Keep scope tight to Control UI config-form support for agent schema nodes

## Blockers / pending decisions
- None for scouting
- Implementation should stay narrowly focused; avoid broad config-form refactors unless required by tests
