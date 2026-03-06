# TOOLS.md — Codex Orchestrator

## Primary Tool

- **Codex CLI**: `/opt/homebrew/bin/codex` (v0.110.0+, GPT-5.4)
- Auth: Local login (not OpenClaw OAuth)
- Invocation: `codex exec "<prompt>" --full-auto --cd <dir> --ephemeral`

## Projects

- All active repos: `~/github/<name>`
- OpenClaw workspace: `~/.openclaw/workspace`

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
