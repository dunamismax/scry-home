# OpenClaw Issue Fix Candidates

> Generated: 2026-03-04 | Source: `gh issue list -R openclaw/openclaw --state open`
> Filtered against open PRs to exclude issues already being worked on.

## Top 10 Fix Candidates

| Rank | Issue | Title | Category | Complexity | Why It's a Good Candidate |
|------|-------|-------|----------|------------|---------------------------|
| 1 | [#34678](https://github.com/openclaw/openclaw/issues/34678) | SQLITE_CANTOPEN should be classified as transient, not fatal | Bug/Reliability | Small | Reporter provides exact patch; add error codes to transient set in `unhandled-rejections.ts`. Prevents LaunchAgent crash loops. |
| 2 | [#34312](https://github.com/openclaw/openclaw/issues/34312) | Gemini native PDF URL duplication (`/v1beta/v1beta`) in subagent-registry | Bug/Regression | Small | One-line URL normalization fix; pattern already applied in other bundles. Copy-paste the existing fix. |
| 3 | [#34636](https://github.com/openclaw/openclaw/issues/34636) | openclaw doctor: False positives on session files flagged as "orphaned" | Bug/UX | Small | Isolated to doctor check logic; tune age thresholds and exclude `.deleted` markers. No runtime behavior impact. |
| 4 | [#34294](https://github.com/openclaw/openclaw/issues/34294) | toolCallId parsing inconsistency causes "Tool not found" | Bug/Regression | Small-Medium | Clear bug with exact failing formats documented. Make tool ID parser tolerant of missing `.`/`:` separators. High impact for Kimi users. |
| 5 | [#34500](https://github.com/openclaw/openclaw/issues/34500) | Include Model Call Count in /usage Command | Enhancement | Small | Pure UI/display addition to `/usage` — increment a counter alongside token counts. Low regression risk. 2 comments show community interest. |
| 6 | [#34661](https://github.com/openclaw/openclaw/issues/34661) | Channel delivery only includes last text segment after tool calls | Bug/Behavior | Medium | Significant UX impact — all pre-tool-call text silently dropped on channels. TUI already handles it correctly (reference impl exists). |
| 7 | [#34776](https://github.com/openclaw/openclaw/issues/34776) | commands.allowFrom causes silent timeout for unauthorized Discord slash commands | Bug/Behavior | Medium | Reporter provides code-level trace across 4 files. Fix: send ephemeral error response when auth check fails instead of silent drop. |
| 8 | [#34414](https://github.com/openclaw/openclaw/issues/34414) | Slack reactions fail due to missing channel ID in inbound metadata | Bug/Behavior | Medium | Well-diagnosed; OAuth scopes confirmed correct. Thread channel ID through inbound metadata for DM reactions. |
| 9 | [#33974](https://github.com/openclaw/openclaw/issues/33974) | WhatsApp group config changes silently ignored until channel restart | Bug/Behavior | Medium | Clear root cause: stale `params.cfg` snapshot in `on-message.ts`. Primary fix: call `loadConfig()` per-message at 4 call sites. |
| 10 | [#33951](https://github.com/openclaw/openclaw/issues/33951) | Slack typing bubble shown for NO_REPLY messages (regression) | Bug/Regression | Medium | Confirmed regression from 2026.3.1→2026.3.2. Typing indicator triggered on reasoning/thinking deltas instead of text output. |

## Top 3: Detailed Fix Approaches

### 1. #34678 — SQLITE_CANTOPEN transient classification

Add a `TRANSIENT_SQLITE_CODES` set (containing `SQLITE_CANTOPEN`, `SQLITE_BUSY`, `SQLITE_LOCKED`, `SQLITE_IOERR`) to `src/infra/unhandled-rejections.ts` and check it alongside `isTransientNetworkError` in the global `unhandledRejection` handler. This prevents SQLite I/O hiccups from triggering `process.exit(1)`, which currently causes macOS LaunchAgent crash loops. The reporter supplies the exact proposed patch.

### 2. #34312 — Gemini PDF URL duplication in subagent-registry

In the subagent-registry bundle's Gemini PDF URL construction, normalize `baseUrl` before appending `/v1beta` — skip the append if it already ends with `/v1beta`. This exact pattern is already applied in `dist/reply-*`, `dist/plugin-sdk/reply-*`, and `dist/pi-embedded-*` bundles. The fix is a single conditional check: `const versionedUrl = baseUrl.endsWith('/v1beta') ? baseUrl : baseUrl + '/v1beta'`.

### 3. #34636 — Doctor false positives on session files

In the doctor command's orphan/stale detection logic, (a) exclude `.deleted` marker files from the orphan file count, (b) check `mtime` recency before flagging files as stale (current threshold may be too aggressive for systems with 45+ active sessions), and (c) verify the transcript directory exists and is non-empty before reporting "orphaned transcripts." Purely cosmetic/diagnostic — zero runtime risk.

## Issues to Avoid

| Issue | Title | Why Avoid |
|-------|-------|-----------|
| [#34438](https://github.com/openclaw/openclaw/issues/34438) | LINE requireMention not working | **Large scope** — requires 3 coordinated changes (mention gating, pending history, DOCKS registry). Needs same architecture as WhatsApp's `applyGroupGating()`. Existing partial PR #29786 with gaps. |
| [#34156](https://github.com/openclaw/openclaw/issues/34156) | XML tags leakage in subagent completion events | **Large scope** — systemic stream contamination across multiple output formats. Root cause in streaming pipeline isolation. Deep investigation needed. |
| [#34609](https://github.com/openclaw/openclaw/issues/34609) | Markdown→mrkdwn bold/italic ambiguity | **Inherently unsolvable** — `*text*` means opposite things in Markdown vs Slack mrkdwn. No clean algorithmic fix exists. Design decision needed from core team. |
| [#34626](https://github.com/openclaw/openclaw/issues/34626) | ACP/ACPX Megathread | **Architectural** — maintainer-only mega-feature discussion. Needs core team buy-in. |
| [#34782](https://github.com/openclaw/openclaw/issues/34782) | Pre-agent durable turn journal | **Architectural** — gateway-level feature request requiring design decisions on storage format, retention, and API surface. |

## Already Being Worked On (PRs Open)

These issues already have open PRs — do not duplicate effort:

- #34722 (Ollama thinking field) → PRs #34772, #34778, #34765, #34758, #34739
- #34690 (Slack double markdown) → PR #34759
- #34654 (Auth profile field name) → PR #34756
- #34535 (Anthropic 529 failover) → current branch `fix/anthropic-529-failover`
- #34509 (Web search key audit) → PRs #34787, #34768
- #34528 (Feishu reaction message_id) → PR #34763
- #34621 (doctor node warning) → PR #34785
- #34632 (context window exceeded) → PR #34761
- #34647 (inbound metadata → Slack) → PR #34743
- #34656 (auth key regression) → PR #34766
- #34537 (TUI final tag) → PRs #34752, #34780
- #34741 (WhatsApp desync) → PR #34783
- #34747 (agent resume after restart) → PR #34786
- #34353 (Discord requireMention) → PR #34754
- #34574 (loopDetection exec) → PR #34770
