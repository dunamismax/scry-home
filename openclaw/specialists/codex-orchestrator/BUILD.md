# BUILD.md

Status: **in progress** — fix issue #39268 in `openclaw/openclaw`, verify, and open a PR.

## Phase plan
- [x] Read core workspace instructions and bug-hunt brief
- [x] Check OpenClaw PR queue headroom
- [ ] Create a clean worktree/branch from current `main`
- [ ] Reproduce or otherwise prove the agents-page dirty-state bug on current source
- [ ] Patch the smallest safe UI fix
- [ ] Add or update the nearest useful test
- [ ] Run targeted verification
- [ ] Commit, push, and open PR

## Acceptance checks / validation commands
- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm vitest run ui/src/ui/controllers/config.test.ts`
- `corepack pnpm vitest run ui/src/ui/views/agents-panels-tools-skills.browser.test.ts`
- `corepack pnpm check`
- `corepack pnpm build`
- Manual/code-path proof that changing an agent setting flips `configFormDirty` and enables Save

## Verification snapshot
- Skill selected: `codex-bug-hunt`
- Open PR headroom checked: **2** open PRs by `dunamismax` on `openclaw/openclaw` (under cap of 10)
- Contribution repo: `/Users/sawyer/github/openclaw`
- Live install repo intentionally not used: `/Users/sawyer/openclaw`

## Immediate next-pass priorities
1. Create fresh worktree from updated `main`
2. Inspect agents/config UI state flow
3. Patch and verify with focused tests

## Blockers / pending human decisions
- None currently
