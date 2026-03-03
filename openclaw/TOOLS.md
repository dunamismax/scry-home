# TOOLS.md - Local Notes

## Projects

- All active repos: `~/github/<name>` (see MEMORY.md for full list)
- OpenClaw workspace (canonical): `~/.openclaw/workspace`
- Scry config repo: `~/github/grimoire`
- Sync script: `~/github/grimoire/scripts/tasks/sync-openclaw.ts`

## OpenClaw Install

- **Git-based install**: `~/openclaw` (main branch, v2026.3.3+)
- **Runtime symlink**: `~/.openclaw/lib/node_modules/openclaw` → `~/openclaw`
- **Binary**: `~/.local/bin/openclaw` → `~/openclaw/openclaw.mjs`
- **Update method**: `cd ~/openclaw && git pull` then restart gateway
- **Service**: LaunchAgent (`ai.openclaw.gateway.plist`), port 18789

## Reference Docs

- **CONTRIBUTING_TO_OPENCLAW.md** (workspace + grimoire) — read before any work on the OpenClaw repo. Covers repo setup, build system, PR template, Signal plugin architecture, test patterns, reviewer expectations.

## SSH Remotes

All repos use dual SSH remotes with host aliases:
- GitHub: `github.com-dunamismax`
- Codeberg: `codeberg.org-dunamismax`
- Push: `git push --force origin main` (hits both)

## Signal

- Scry's number: `+19414416722`
- Stephen's number: `+19412897570`
- CLI: `/opt/homebrew/bin/signal-cli`

## Paired Nodes

- Stephen's MacBook Air (remote macOS node — use `nodes.run` for macOS-only tasks)

## Enabled Integrations (2026-03-03)

- **Browser**: Brave, profiles `openclaw` (port 18800) and `chrome` (port 18792)
- **ACP**: acpx backend, default agent codex, allowed: pi/claude/codex/opencode/gemini
- **Sub-agents**: depth 2, 8 concurrent, 5 children/agent, 2h archive
- **Web search**: Brave provider, API key configured, functional
- **Web fetch**: 50K chars, 30s timeout
- **Notion**: "Scry" integration → "Stephen's Notion" workspace (share pages to grant access)
- **Whisper**: Local speech-to-text (no API key, runs on Apple Silicon)

## Declined Integrations

- Email / Himalaya — declined by Stephen (2026-03-03)

## Installed CLIs

- `gh`, `docker`, `ffmpeg`, `yt-dlp`, `codex`, `claude`, `jq`, `tmux`, `summarize`, `whisper`, `clawhub` — all available
- **Not installed**: acpx, mcporter, playwright

## TTS

- Default voice: whatever's configured (no specific preference noted yet)
