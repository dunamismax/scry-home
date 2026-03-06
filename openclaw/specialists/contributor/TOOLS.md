# TOOLS.md - Local Notes

## SSH Remotes

All repos use dual SSH remotes with host aliases:
- GitHub: `github.com-dunamismax`
- Codeberg: `codeberg.org-dunamismax`

## Installed CLIs

- `gh`, `docker`, `jq`, `tmux`, `claude`, `codex` — all available

## Key Tool: GitHub CLI

- `gh issue list --repo <owner/repo>` — list issues
- `gh issue view <number> --repo <owner/repo>` — read issue details
- `gh pr list --repo <owner/repo>` — check existing PRs
- `gh pr create --repo <owner/repo>` — submit PRs
- `gh repo clone <owner/repo>` — clone repos
- `gh repo fork <owner/repo>` — fork if needed
