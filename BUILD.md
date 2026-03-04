# grimoire — Build Tracker

**Status:** Phase 1 — Active maintenance
**Last Updated:** 2026-03-04
**Branch:** `main`

---

## What This Repo Is

Scry's operational control plane. Contains identity files (SOUL.md, AGENTS.md), CLI tooling for multi-repo management, OpenClaw workspace sync, SSH/config backup scripts, and project templates. This is the source of truth for how the entire dev environment is configured and maintained.

## Architecture Snapshot

```
grimoire/
├── SOUL.md, AGENTS.md          # Canonical identity (workspace copies sync here)
├── openclaw/                   # OpenClaw workspace mirror (MEMORY, HEARTBEAT, cron state)
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

- [x] CLI scaffold with unified `scripts/cli.ts` entry
- [x] Multi-repo project registry (`projects.config.ts`)
- [x] `sync:openclaw` — workspace → grimoire canonical sync
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
bun run lint     ✅  (23 files, no issues)
bun run typecheck ✅
bun test          — (4 test files: parse-repos, sync-remotes, crypto, normalize-path)
```

Last verified: 2026-03-04

---

## Agent Instructions

- **Canonical sync direction:** OpenClaw workspace → grimoire. Never edit grimoire copies of SOUL.md/AGENTS.md directly.
- Run `bun run scry:sync:openclaw -- --commit` after workspace identity file changes.
- Keep `openclaw/cron-jobs.json` committed when state changes — it's the cron audit trail.
- Update this BUILD.md in the same commit as meaningful changes.
- If adding a new CLI command: register in `scripts/cli.ts`, add to package.json scripts, document here.
