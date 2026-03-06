# grimoire — Build Tracker

**Status:** Phase 1 — Active maintenance (specialist routing + backup coverage reconciled)
**Last Updated:** 2026-03-06
**Branch:** `main`

---

## What This Repo Is

Scry's operational control plane. Contains identity files (SOUL.md, AGENTS.md), CLI tooling for multi-repo management, OpenClaw workspace sync, SSH/config backup scripts, and project templates. This is the source of truth for how the entire dev environment is configured and maintained.

## Architecture Snapshot

```
grimoire/
├── SOUL.md, AGENTS.md          # Canonical identity (workspace copies sync here)
├── openclaw/                   # OpenClaw workspace mirror (MEMORY, HEARTBEAT, cron state, specialist doc backups)
├── scripts/
│   ├── cli.ts                  # Unified CLI entry point
│   ├── common.ts               # Shared utilities
│   ├── crypto.ts               # Encryption helpers
│   ├── projects.config.ts      # Multi-repo project registry
│   └── tasks/                  # Individual CLI commands
│       ├── sync-openclaw.ts    # Workspace → grimoire sync (--commit flag)
│       ├── sync-remotes.ts     # Dual-push remote verification
│       ├── doctor.ts           # Health check
│       ├── bootstrap.ts        # Fresh machine setup
│       ├── projects.ts         # Multi-repo list/doctor/install/verify
│       └── setup-*.ts          # Workstation, SSH, config backup
├── prompts/                    # Project prompt templates
├── test/                       # Unit tests (parse-repos, sync-remotes, crypto, normalize-path)
└── vault/                      # Encrypted sensitive config backups
```

**Stack:** TypeScript + Bun. Biome for linting. No framework — pure CLI tooling.

---

## Phase Plan

### Phase 1 — Core Tooling (Current)

- [x] CLI scaffold with unified `scripts/cli.py` entry
- [x] Multi-repo project registry (`projects.config.ts`)
- [x] `sync:openclaw` — workspace → grimoire canonical sync
- [x] Specialist workspace doc mirror under `openclaw/specialists/`
- [x] `sync:remotes` — verify/fix dual SSH push remotes
- [x] `doctor` — environment health check
- [x] `bootstrap` — fresh machine provisioning
- [x] SSH key backup/restore tooling
- [x] Config backup with encryption (vault)
- [x] Unit tests for core utilities
- [x] OpenClaw cron-based workspace sync (daily 3am ET)
- [ ] `projects:verify` — run lint/typecheck across all repos in one pass
- [ ] CLI help/docs generation from command registry

### Phase 2 — Operational Reliability

- [x] Specialist bench hardening expansion: codex-orchestrator routing documented, missing specialist bootstrap/runbook assets seeded, generic hardening rolled out bench-wide
- [x] Managed weekly smoke reconciliation covers the full seven-agent specialist bench
- [ ] Snapshot command: capture full environment state (versions, configs, repo SHAs) to timestamped file
- [ ] Drift detection: compare workspace vs grimoire copies, alert on mismatch
- [ ] Config backup verification cron (automated, not just manual)
- [ ] Test coverage for all task scripts (currently only core utils tested)

### Phase 3 — Multi-Machine Sync

- [ ] `sync:work-desktop` improvements (currently exists but scope unclear)
- [ ] Cross-machine config reconciliation
- [ ] Tailscale-aware remote sync

---

## Verification Snapshot

```
uv run ruff check scripts/tasks/sync_openclaw.py scripts/tasks/reconcile_cron.py scripts/tasks/harden_specialists.py ✅
uv run python -m scripts.tasks.harden_specialists --discover --include-maintainer                                   ✅
uv run python -m scripts.tasks.sync_openclaw                                                                        ✅
uv run python -m scripts.tasks.reconcile_cron --scope=smoke                                                        ✅ (dry run)
uv run python -m scripts.tasks.reconcile_cron --scope=smoke --apply                                                ✅
workspace-codex-orchestrator/scripts/specialist-weekly-smoke.sh                                                    ✅
workspace-contributor/scripts/specialist-weekly-smoke.sh                                                           ✅
workspace-luma/scripts/specialist-weekly-smoke.sh                                                                  ✅
```

Last verified: 2026-03-06

---

## Agent Instructions

- **Canonical sync direction:** OpenClaw workspace → grimoire. Never edit grimoire copies of SOUL.md/AGENTS.md directly.
- Run `uv run python -m scripts sync:openclaw --commit` after workspace identity file changes.
- Keep `openclaw/cron-jobs.json` committed when state changes — it's the cron audit trail.
- Update this BUILD.md in the same commit as meaningful changes.
- If adding a new CLI command: register in `scripts/cli.py`, add to package.json scripts, document here.

## Immediate Next Pass Priorities

- Add a deterministic smoke that checks codex-orchestrator proactive heartbeat/update requirements, not just file presence/attribution policy.
- Decide whether specialist generated assets (`hooks/`, `scripts/`) should also be mirrored into grimoire or continue to be derived from `harden_specialists.py`.
- Keep vault backup artifacts and cron audit trail committed whenever scheduled jobs rotate them.
