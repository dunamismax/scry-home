# TOOLS.md - Local Notes

## Projects

- All active repos: `~/github/<name>` (see MEMORY.md for full list)
- OpenClaw workspace (canonical): `~/.openclaw/workspace`
- Scry config repo: `~/github/grimoire`
- Sync script: `~/github/grimoire/scripts/tasks/sync_openclaw.py`

## OpenClaw Install

- **Git-based install**: `~/openclaw` (main branch, v2026.3.3+)
- **Runtime symlink**: `~/.openclaw/lib/node_modules/openclaw` → `~/openclaw`
- **Binary**: `~/.local/bin/openclaw` → `~/openclaw/openclaw.mjs`
- **Update method**: `cd ~/openclaw && git pull` then restart gateway
- **Service**: LaunchAgent (`ai.openclaw.gateway.plist`), port 18789

## Reference Docs

- **OpenClaw docs (local mirror)**: `/Users/sawyer/openclaw/docs`
- **OpenClaw docs index**: `https://docs.openclaw.ai/llms.txt`
- **CONTRIBUTING_TO_OPENCLAW.md**: `~/github/grimoire/reference/CONTRIBUTING_TO_OPENCLAW.md` — read before any work on the OpenClaw repo. Covers repo setup, build system, PR template, Signal plugin architecture, test patterns, reviewer expectations.

## Grimoire CLI Commands

- `uv run python -m scripts sync:openclaw` — sync workspace → grimoire (add `--commit` to auto-push); now mirrors all `.md` files dynamically
- `uv run python -m scripts specialists:harden` — deploy hooks, templates, smoke scripts, USER.md, TOOLS.md, and reporting rules to specialist workspaces
- `uv run python -m scripts openclaw:audit` — check workspace doc completeness, grimoire mirror consistency, and stale path references
- `uv run python -m scripts cron:reconcile` — reconcile managed cron jobs against manifest (add `--apply` to converge; `--scope=all` for system + smoke jobs)

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

## Enabled Integrations (updated 2026-03-06)

- **Browser**: Brave, profiles `openclaw` (port 18800) and `chrome` (port 18792)
- **ACP**: acpx backend, default agent codex, allowed: pi/claude/codex/opencode/gemini
- **Sub-agents**: depth 2, 8 concurrent, 5 children/agent, 2h archive
- **Web search**: Brave provider, API key configured, functional
- **Web fetch**: 50K chars, 30s timeout
- **Notion**: "Scry" integration → "Stephen's Notion" workspace (share pages to grant access)
- **Whisper**: Local speech-to-text (no API key, runs on Apple Silicon)
- **Ollama**: Local LLM inference, `qwen2.5:14b` pulled (9GB)

## Declined Integrations

- Email / Himalaya — declined by Stephen (2026-03-03)

## Installed CLIs

- **Core dev**: `gh`, `docker`, `neovim`, `tmux`, `lazygit`, `git-delta`, `direnv`, `mise`, `just`, `pre-commit`, `shellcheck`, `shfmt`, `biome`, `cmake`, `make`
- **AI/ML agents**: `codex`, `claude`, `ollama`, `whisper`
- **Search/fetch**: `ripgrep`, `fd`, `fzf`, `jq`, `yq`, `bat`, `eza`, `zoxide`
- **Media**: `ffmpeg`, `yt-dlp`, `imagemagick`, `sox`, `summarize`
- **Network**: `curl`, `wget`, `httpie`, `grpcurl`, `aria2`, `nmap`, `mosh`
- **Infra**: `kubectl`, `k9s`, `helm`, `kubectx`, `terraform` (via mise), `protobuf`
- **Utilities**: `parallel`, `entr`, `pv`, `hyperfine`, `tokei`, `dust`, `duf`, `procs`, `sd`, `difftastic`, `mkcert`, `watchman`, `pandoc`, `clawhub`
- **Not installed**: acpx, mcporter, playwright
- **ACP note**: ACP harness access is available through OpenClaw runtime/session tooling even though the standalone `acpx` CLI is not installed locally.

## Python AI/ML Stack (uv-managed, Python 3.14)

- **ML frameworks**: PyTorch 2.10 (MPS ✓), MLX 0.31, mlx-lm
- **HuggingFace**: transformers, diffusers, datasets, accelerate, safetensors
- **Tokenizers**: tiktoken, sentencepiece
- **Imaging/data**: Pillow, scipy, matplotlib, numpy, einops
- **UI**: gradio

## TTS

- Default voice: whatever's configured (no specific preference noted yet)
