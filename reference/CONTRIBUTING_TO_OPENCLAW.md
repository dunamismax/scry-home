# Contributing to OpenClaw — Agent Field Guide

> Hard-won lessons from contributing to the OpenClaw project.
> Read this before touching the repo. It will save you hours.
>
> Contributor: Stephen Sawyer (`dunamismax`)
> First contribution: PR #32217 (2026-03-02) — Signal reaction messageId fallback
> Repo: https://github.com/openclaw/openclaw

---

## Repo Setup

- Upstream: `https://github.com/openclaw/openclaw.git` (remote `origin`)
- Fork: `git@github.com-dunamismax:dunamismax/openclaw.git` (remote `fork`)
- Local clone: `~/github/openclaw`
- **Never** work directly on `main` in the local clone — it tracks upstream and is used by the live OpenClaw instance
- Branch from `main`, push to `fork`, PR against `openclaw:main`

### Fork Remote Setup

```bash
cd ~/github/openclaw
git remote add fork git@github.com-dunamismax:dunamismax/openclaw.git
```

### Keeping Main Current

```bash
git checkout main
git pull origin main
```

---

## Build System

OpenClaw uses **pnpm** (not npm, not bun). The repo specifies `pnpm@10.23.0` via `packageManager` in `package.json`.

### Installing pnpm

If `pnpm` isn't on PATH, use `corepack`:

```bash
corepack pnpm --version
```

If corepack needs enabling and you don't have sudo:

```bash
# Alias workaround
alias pnpm="corepack pnpm"
```

### Required Build/Test Commands

Run these before every commit:

```bash
pnpm build && pnpm check && pnpm test
```

For targeted test runs:

```bash
# Signal-specific tests
pnpm vitest run src/signal/
pnpm vitest run src/channels/plugins/actions/actions.test.ts

# Single test file
pnpm vitest run path/to/test.ts
```

### Build Gotchas

- `pnpm install --frozen-lockfile` in worktrees — always run this before building in a new worktree
- The repo uses a `prepare` git hook that runs on install — this is normal
- TypeScript compilation is strict — `pnpm check` catches type errors that `pnpm build` alone might miss
- Test framework is **Vitest** (v4.x), not Jest

---

## Git Workflow

### Branch Naming

Use descriptive prefixed branches:

```
docs/signal-block-streaming
fix/signal-numeric-messageid
feat/signal-group-reactions
test/signal-reaction-coverage
```

### Commits

- **Atomic commits** — one concern per commit
- **Conventional commit messages**: `fix(signal):`, `docs(signal):`, `feat(signal):`, `test(signal):`
- **Commit as `dunamismax`** — no AI attribution, no Co-Authored-By, no agent fingerprints. Period.
- Push to the fork: `git push fork <branch-name>`

### Parallel PRs with Git Worktrees

When submitting multiple independent PRs, use worktrees to avoid branch-switching conflicts:

```bash
cd ~/github/openclaw
git fetch origin main
git worktree add -b docs/my-docs-pr /tmp/oc-docs main
git worktree add -b fix/my-bugfix /tmp/oc-fix main

# Install deps in each worktree
cd /tmp/oc-docs && corepack pnpm install --frozen-lockfile
cd /tmp/oc-fix && corepack pnpm install --frozen-lockfile

# Work independently in each, then clean up
cd ~/github/openclaw
git worktree remove /tmp/oc-docs
git worktree remove /tmp/oc-fix
git branch -D docs/my-docs-pr fix/my-bugfix  # after PRs are merged
```

**Important:** If two PRs touch the same file (e.g., both modify `signal.md`), each worktree branches from `main` independently. They won't conflict during development, but may need rebase if one merges first.

---

## PR Template

The PR template at `.github/pull_request_template.md` is **mandatory**. Fill out every section. Reviewers (especially steipete) value thoroughness even for docs-only PRs.

### Sections That Matter Most

1. **Summary** — 2-5 bullets: Problem, why it matters, what changed, what did NOT change (scope boundary)
2. **Security Impact** — Always fill this out. Even for docs PRs, write "No" for each question. Don't skip it.
3. **Human Verification** — What you personally verified, how, and what you did NOT verify. Honesty here builds trust.
4. **Failure Recovery** — How to revert if this breaks. Even trivial changes: "Revert the single commit."
5. **Risks and Mitigations** — "None" is a valid answer. Don't invent risks that don't exist.

### PR Creation via CLI

```bash
gh pr create \
  --repo openclaw/openclaw \
  --head dunamismax:<branch-name> \
  --base main \
  --title "type(scope): description" \
  --body '<full PR template>'
```

---

## Project Architecture (Signal Plugin)

### Key Files

| File | Purpose |
|---|---|
| `src/signal/` | Signal daemon integration (signal-cli JSON-RPC + SSE) |
| `src/channels/plugins/actions/signal.ts` | Signal message action handler (reactions, sends) |
| `src/channels/plugins/actions/reaction-message-id.ts` | Shared messageId resolution for reactions |
| `src/channels/plugins/actions/actions.test.ts` | Tests for all channel action handlers |
| `src/config/types.signal.ts` | Signal-specific config types |
| `src/config/types.channel-messaging-common.ts` | Shared channel config types (blockStreaming, chunkMode, etc.) |
| `src/config/types.agent-defaults.ts` | Agent defaults config (blockStreamingDefault, humanDelay, etc.) |
| `src/config/types.base.ts` | Base types (BlockStreamingChunkConfig, HumanDelayConfig, etc.) |
| `src/agents/tools/common.ts` | Shared tool utilities (readStringParam, readStringOrNumberParam, etc.) |
| `docs/channels/signal.md` | Signal channel documentation |
| `docs/concepts/streaming.md` | Streaming/chunking architecture docs |

### Action Handler Pattern

Channel actions follow a consistent adapter pattern:

```typescript
export const signalMessageActions: ChannelMessageActionAdapter = {
  listActions: ({ cfg }) => { /* return available actions */ },
  supportsAction: ({ action }) => { /* return true if handled by plugin */ },
  handleAction: async ({ action, params, cfg, accountId, toolContext }) => {
    // Route by action type
  },
};
```

### Test Pattern (Signal Reactions)

Tests use mocked signal-cli functions and helper wrappers:

```typescript
// Mock setup
const sendReactionSignal = vi.fn(async (..._args: unknown[]) => ({ ok: true }));
vi.mock("../../../signal/send-reactions.js", () => ({ sendReactionSignal, removeReactionSignal }));

// Helper
async function runSignalAction(action, params, options?) {
  const cfg = options?.cfg ?? { channels: { signal: { account: "+15550001111" } } };
  await signalMessageActions.handleAction?.({ channel: "signal", action, params, cfg, ...options });
}

// Test
it("uses numeric messageId directly", async () => {
  sendReactionSignal.mockClear();
  await runSignalAction("react",
    { to: "+15559999999", messageId: 1737630212345, emoji: "👍" },
    { toolContext: { currentMessageId: "9999999999999" } },
  );
  expect(sendReactionSignal).toHaveBeenCalledWith(
    "+15559999999", 1737630212345, "👍", expect.objectContaining({}),
  );
});
```

### Config Type Verification

Before writing docs that reference config keys, **always verify they exist in source types**:

```bash
# Find where a config key is defined
grep -rn "blockStreamingDefault\|blockStreamingBreak" src/config/ --include="*.ts"

# Check the full type shape
grep -A10 "BlockStreamingChunkConfig" src/config/types.base.ts
```

This prevents docs from referencing config keys that don't exist or have different names than expected.

---

## Documentation Style

### signal.md Conventions

- Heading levels: `##` for major sections, `###` for subsections
- Config blocks: use `json5` fenced code blocks (not `json` — the config format supports comments and trailing commas)
- Field references: use inline code for config paths (`channels.signal.blockStreaming`)
- Tables for field references, bullet lists for explanations
- Tone: technical, direct, practical. Not marketing copy.

### Section Placement

The signal.md sections follow a specific flow:

1. Prerequisites → Quick setup → What it is
2. Config writes → Number model
3. Setup paths (A: QR link, B: SMS register)
4. External daemon mode
5. Access control
6. **← New opinionated config sections go here**
7. How it works (behavior)
8. Media + limits
9. **← New streaming/feature sections go here**
10. Typing + read receipts
11. Reactions
12. Delivery targets
13. Troubleshooting
14. Security notes
15. Configuration reference

---

## Lessons Learned

### readStringParam vs readStringOrNumberParam

`readStringParam` returns `undefined` for numeric values. Signal uses timestamp-based message IDs (e.g., `1772501354681`) which callers commonly pass as numbers. If you're reading a param that could be numeric, use `readStringOrNumberParam` or handle the coercion locally.

### resolveReactionMessageId

Reaction messageId resolution was refactored into a shared function at `src/channels/plugins/actions/reaction-message-id.ts`. It uses `readStringOrNumberParam` and falls back to `toolContext.currentMessageId`. Don't duplicate this logic in channel handlers — use the shared function.

### The Codebase Moves Fast

Between writing a fix description and submitting it, the code may have been refactored. Always read the current source before implementing. The `resolveReactionMessageId` refactoring happened between PR #32217 and the follow-up numeric coercion fix — by the time we went to implement the fix, it was already done.

### steipete Reviews Carefully

Peter Steinberger (steipete) is the project lead and primary reviewer. He values:
- Thorough PR descriptions (fill out every template section)
- Clear scope boundaries (what changed AND what did not change)
- Security awareness even for low-risk changes
- Evidence of verification (not just "it works" — show how you checked)

### No Signal Subsystem Maintainer

As of 2026-03-02, the CONTRIBUTING.md maintainer list has no Signal subsystem owner. This is an opportunity to establish ownership through consistent, high-quality contributions. Other subsystems (Telegram, Discord, Slack, IRC, etc.) all have named maintainers.

### The Discord Matters

Project Discord: https://discord.gg/qkhbAGHRBT — being active there helps visibility and builds relationships with maintainers.

---

## PR History

| PR | Type | Title | Status |
|---|---|---|---|
| #32217 | fix | Signal reaction messageId fallback + queued message channelId passthrough | Open |
| #32396 | docs | Signal block streaming and progressive delivery guide | Open |
| #32397 | test | Numeric messageId coverage for Signal reaction handler | Open |
| #32398 | docs | Recommended DM configuration for personal assistant use | Open |

---

## Quick Reference

```bash
# Sync main
cd ~/github/openclaw && git checkout main && git pull origin main

# Create a worktree for a new PR
git worktree add -b <branch> /tmp/oc-<shortname> main
cd /tmp/oc-<shortname> && corepack pnpm install --frozen-lockfile

# Build + test
corepack pnpm build && corepack pnpm check && corepack pnpm test

# Targeted Signal tests
corepack pnpm vitest run src/channels/plugins/actions/actions.test.ts

# Commit (as dunamismax, no AI attribution)
git add -A && git commit -m "type(scope): description"

# Push to fork
git push fork <branch>

# Create PR
gh pr create --repo openclaw/openclaw --head dunamismax:<branch> --base main --title "..." --body "..."

# Cleanup
cd ~/github/openclaw
git worktree remove /tmp/oc-<shortname>
git branch -D <branch>
```
