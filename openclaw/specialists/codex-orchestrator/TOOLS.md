# TOOLS.md — Codex Orchestrator

## Primary Tool

- **Codex CLI**: `/opt/homebrew/bin/codex` (v0.110.0+, default model GPT-5.4)
- Auth: Local login (not OpenClaw OAuth)
- Preferred build/review reasoning: `high`
- Docs/pattern lookups: use local repo docs first; use Context7 first for current external docs; use web search only as fallback

## Standard Lane Wrappers

### Launch a tracked exec lane

```bash
/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/codex-lane-launch.sh \
  <lane-name> <repo-dir> <prompt-file> [reasoning] [sandbox]
```

Defaults:
- reasoning: `high`
- sandbox: `workspace-write`
- model config comes from Codex CLI defaults unless explicitly overridden

Artifacts written to:
- `runs/<timestamp>-<lane>/prompt.md`
- `runs/<timestamp>-<lane>/stdout.log`
- `runs/<timestamp>-<lane>/final.md`
- `runs/<timestamp>-<lane>/manifest.json`
- `runs/<timestamp>-<lane>/exit-code.txt`

### Summarize a tracked lane

```bash
python3 /Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/codex-lane-status.py \
  /Users/sawyer/.openclaw/workspace-codex-orchestrator/runs/<run-dir>
```

## Preferred Codex Exec Flags

For most non-trivial lanes:

```bash
codex exec "<prompt>" \
  --full-auto \
  --cd <repo> \
  --ephemeral \
  --json \
  -o <final-file> \
  -c features.command_attribution=false \
  -c model_reasoning_effort=high \
  -c model_reasoning_summary=concise \
  -c model_auto_compact_token_limit=180000
```

Use `-s read-only` for scouting/review lanes.
Use `-s danger-full-access` only when justified by cross-repo or non-worktree writes.

## Projects

- All active repos: `~/github/<name>`
- OpenClaw workspace: `~/.openclaw/workspace-codex-orchestrator`

## SSH Remotes

All repos use dual SSH remotes:
- GitHub: `github.com-dunamismax`
- Codeberg: `codeberg.org-dunamismax`

## Installed CLIs

- **Core dev**: `gh`, `docker`, `neovim`, `tmux`, `git-delta`, `biome`, `just`
- **AI agents**: `codex`, `claude`, `ollama`
- **Search**: `ripgrep`, `fd`, `fzf`, `jq`, `bat`
- **Build**: `bun`, `uv`, `ruff`, `cargo`, `go`

## Stack Defaults

- **TypeScript**: Bun + Vite + React Router + Tailwind + shadcn/ui + Drizzle + Biome
- **Python**: uv + ruff
- **Disallowed**: npm/pnpm/yarn, ESLint/Prettier, Next.js, Auth.js
