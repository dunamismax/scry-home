# CLAUDE.md

> Code agent instructions for this repository. Read these files in order.

1. Read `SOUL.md` — identity, worldview, voice.
2. Read `AGENTS.md` — operational rules, stack contract, verification.
3. Read task-relevant code and docs.

## Repo-Specific Notes

- CLI entrypoint: `scripts/cli.py` → all tasks under `scripts/tasks/`.
- Run `uv run python -m scripts doctor` to verify prerequisites and project health.
- Run `bun run lint` before committing; use `uv run python -m scripts doctor` when you need a functional repo health check.
- Use `uv run python -m scripts sync:remotes --fix` to configure dual push remotes on new repos.
- The `openclaw/` directory is auto-synced from the OpenClaw workspace. Do not edit files there directly.
- The `vault/` directory contains encrypted backups. Never commit decrypted secrets.
- SOUL.md and AGENTS.md at repo root are synced from the OpenClaw workspace (canonical source). Edits here get overwritten on next sync.
- Multi-agent bench governance (specialist delegation + maintenance rules) also lives in workspace SOUL/AGENTS and is propagated by sync.
