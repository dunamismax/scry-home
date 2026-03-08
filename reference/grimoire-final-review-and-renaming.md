# Historical Note: grimoire Final Review and Renaming

Date: 2026-03-07

## Bottom Line

`grimoire` is not a normal code repo. It is Scry's operating base: the versioned home for identity and operator doctrine, the downstream git mirror of the live OpenClaw workspace, the local recovery kit for critical machine state, and a small Python CLI for syncing, backing up, and policing that system.

That is why the current name feels off. The repo is doing real control-plane work, not serving as a bag of magic notes. The right mental model is "Scry home/control plane with recovery tooling," not "miscellaneous lore vault."

## What The Repo Actually Is

It is four things at once:

1. A canonical publication repo for Scry identity and operating rules, even though the live source of truth is now `~/.openclaw/workspace`.
2. A downstream backup/mirror for the live OpenClaw workspace and specialist workspaces.
3. A local-machine recovery repo for encrypted config backups and restore verification.
4. A workstation and repo-fleet ops CLI for Stephen's environment.

The important relationship is this:

- `~/github/openclaw` is the product codebase.
- `~/.openclaw/workspace` is the live Scry/OpenClaw operator workspace.
- `~/github/grimoire` is the durable, versioned export/control repo around that workspace.

So `grimoire` is best understood as the Scry/OpenClaw control repository, not the OpenClaw app repo and not just a docs repo.

## What Should Remain Inside It

These belong here and fit the repo's real job:

- Root canon and orientation files: `SOUL.md`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `BUILD.md`.
- The Scry/OpenClaw lifecycle automation in `scripts/`:
  - workspace sync
  - backup/restore verification
  - remote normalization
  - specialist hardening
  - workstation bootstrap that is directly about bringing Scry/OpenClaw back online
- Evergreen operator/reference docs that explain how Stephen works with Scry and OpenClaw.
- A deliberately scoped `openclaw/` export, if the point is durable backup/history of workspace docs and specialist doctrine.
- Small backup metadata and restore checklists.

What should stay conceptually central:

- identity
- doctrine
- sync/export logic
- recovery procedures
- operator runbooks

## What Should Be Split Or Moved Elsewhere

These do not fit well in the same git repo long term:

### 1. Machine-local runtime state

The repo currently tracks machine-specific operational data such as:

- phone numbers
- absolute `/Users/sawyer/...` paths
- live cron delivery targets
- exec-approval socket paths

Examples:

- `openclaw/TOOLS.md` includes Stephen's phone number and local install paths.
- `scripts/tasks/reconcile_cron.py` writes Signal delivery targets and hard-coded local paths into tracked cron manifests.
- `openclaw/exec-approvals.json` is a live local runtime artifact, not durable doctrine.

This data belongs in the live `.openclaw` runtime, a private local-state repo, or generated exports that are explicitly excluded from public/history-facing surfaces.

### 2. Rolling encrypted backup blobs

The tracked encrypted archive in `vault/config/critical-configs.tar.enc` is already 46 MB and currently dirty in git. That is a poor fit for routine repo history.

Keep in git only if the repo is explicitly a private binary backup ledger. Otherwise move the actual encrypted payloads to:

- a separate private backup repo
- a blob/object store
- Git LFS
- a dedicated backup target outside normal source history

Keep only the metadata/checklist here.

### 3. Generated workspace residue

The codex-orchestrator workspace is generating review swarm prompts, run files, and report-path references in the live workspace. Those are not clean mirror material for this repo.

Generated run artifacts should live in:

- the specialist workspace only
- `REPO_REVIEWS/`
- a dedicated runs/archive location

They should not silently expand the mirror surface.

### 4. Non-Scry generic workstation utilities

`scripts/tasks/sync_work_desktop.py` is useful, but it is business file-sync tooling, not Scry control-plane logic. That sort of general workstation automation should probably move to:

- `~/github/scripts`
- `dotfiles`
- a separate Stephen-ops repo

unless Stephen intentionally wants this repo to be his full personal ops center.

## Architecture / Ops Review

### Strengths

- The repo has a real job and a coherent center of gravity: identity + ops + recovery.
- The sync direction is explicit in code: workspace to repo, not the reverse.
- Backup logic is not fake; it encrypts, fingerprints, and verifies restores.
- The repo is already acting as a hardening and discipline layer for specialist workspaces.
- Dual-remote enforcement and workstation bootstrap are pragmatic and aligned with Stephen's operating style.

### Primary Risks And Drift

#### 1. Canonical-source ambiguity

The biggest conceptual bug is that the docs do not agree on what is canonical.

- `README.md` says `grimoire` is "The canonical source of truth for SOUL.md, AGENTS.md..."
- `scripts/tasks/sync_openclaw.py` says the OpenClaw workspace is canonical and syncs into the repo.
- `CLAUDE.md` also says root `SOUL.md` and `AGENTS.md` are synced from the workspace and will be overwritten.

Current reality: the live workspace is canonical; `grimoire` is the durable export/control repo.

That wording needs to be fixed everywhere. Right now the repo describes itself as the source while behaving like the downstream mirror.

#### 2. Audit and sync are out of contract

The repo's own verification tells on it.

`openclaw:audit` currently fails with:

- drift in `openclaw/MEMORY.md`
- drift in `openclaw/memory/2026-03-07.md`
- missing `codex-orchestrator` mirror files
- stale report-path references

More importantly, the audit logic and sync logic do not agree on scope:

- sync mirrors selected specialist roots, `memory/docs/prompts`, plus `scripts/templates/hooks`
- audit recursively expects all specialist markdown under the workspace except `reviews`

That is why generated `runs/.../prompt.md` files show up as missing mirror files even though the sync tool never promised to mirror `runs/`.

This needs one source of truth for "what is mirrorable."

#### 3. Verification contract drift

The repo claims a verification lane it cannot actually run:

- `scripts/projects_config.py` says `grimoire` verifies with `bun run lint` and `bun run typecheck`
- `package.json` does not define a `typecheck` script
- `bun run typecheck` fails immediately

Also, repo-wide Ruff currently fails on mirrored specialist scripts plus an unused import in `scripts/tasks/audit_openclaw_docs.py`.

That means the current health story is overstated. The repo is operationally useful, but its advertised verification contract is not honest yet.

#### 4. Tracked private/local operational residue

The repo contains a lot of data that is durable for Stephen but not durable for the repo:

- Signal numbers
- absolute local paths
- live runtime sockets
- host-specific install notes

If this repo is ever public, mirrored publicly, or shared more widely, this is policy drift. Even if it stays private, it still makes the repo less portable and less clean.

#### 5. Git is being used as a rolling encrypted backup medium

The daily backup job:

1. creates/updates the encrypted config archive
2. verifies it
3. runs `sync:openclaw --commit`

That couples local backup churn with git state churn. The result is a repo that can become a binary backup ledger by accident.

This is workable for now, but it is not the clean long-term architecture.

#### 6. Referenced docs do not fully exist

`README.md` points to `openclaw/BACKUPS.md`, but that file is not present in the repo.

That is small compared to the other issues, but it is exactly the kind of trust erosion that hurts a repo like this. If this repo is the recovery home, referenced recovery docs need to actually be there.

## What This Repo Should Evolve Into

The clean future state is:

- a versioned Scry control repository
- a narrow, deliberate export of the live OpenClaw workspace
- operator doctrine and recovery documentation
- lightweight automation for sync, restore, and bootstrap

It should not evolve into:

- a second live OpenClaw workspace
- a dumping ground for generated run artifacts
- a generic personal automation repo
- a rolling archive of large encrypted blobs
- a public history of machine-specific runtime state

The best long-term shape is:

1. `scry-<name>` repo as the control-plane home
2. `.openclaw` as live runtime/private state
3. `openclaw` repo as product code
4. separate private backup storage for large encrypted payloads
5. `scripts` or `dotfiles` for general non-Scry workstation automation

## Rename Candidates, Ranked

| Rank | Name | Style | Why it fits |
|---|---|---|---|
| 1 | `scry-home` | Brand-aligned + literal | Best match for what this actually is: the home/base for Scry identity, ops, backup, and doctrine. |
| 2 | `scry-core` | Operational + broad | Strong if Stephen wants something tighter and more technical than "home." |
| 3 | `scry-ops` | Literal | Excellent if he wants the repo read primarily as an ops/control repo, but it undersells identity and recovery. |
| 4 | `scry-control-plane` | Maximum precision | The most accurate operational name, but a little long and less graceful in daily use. |
| 5 | `scry-anchor` | Memorable | Conveys "stable source and recovery point" without fantasy fluff. |
| 6 | `scry-base` | Minimal | Clean and readable, but less distinctive. |
| 7 | `scry-foundry` | Memorable/brand-y | Good if he wants something stronger than "home," but it feels more builder-oriented than operator-oriented. |
| 8 | `scry-vault` | Narrow/specialized | Strong only if the repo is deliberately narrowed to backup/recovery. Right now it is too narrow. |

## Recommended Final Name

`scry-home`

Why:

- It matches Stephen's own description: "backup/home for Scry AI + OpenClaw identity, ops, automation, and supporting materials."
- It is easy to say, easy to remember, and not embarrassing.
- It covers identity, doctrine, ops, and recovery without pretending the repo is only code or only automation.
- It leaves room for the repo to stay important without sounding like a sidecar utility.

If Stephen wants colder and more technical, use `scry-core`.

## Immediate Next Steps

1. Pick the boundary: is this repo the Scry control repo only, or the full personal ops repo? Decide that explicitly.
2. Rewrite the self-description so it consistently says: live workspace is canonical, this repo is the versioned export/control home.
3. Fix the verification contract:
   - add a real `typecheck`, or
   - remove the claim from `projects_config.py` and docs.
4. Fix the audit/sync contract so `openclaw:audit` checks only what `sync:openclaw` intentionally mirrors.
5. Remove or relocate machine-local runtime state from tracked surfaces:
   - phone numbers
   - absolute host paths
   - exec approval runtime data
   - generated run artifacts
6. Move large encrypted backup payloads out of normal repo history unless Stephen intentionally wants this repo to remain a private backup ledger.
7. Clean the broken references, starting with the missing `openclaw/BACKUPS.md`.
8. After the boundary cleanup, rename the repo. Do not rename first; the naming decision is clearer once the contents are honest.

## Evidence Checked

- Repo canon: `SOUL.md`, `AGENTS.md`, `README.md`, `CLAUDE.md`, `BUILD.md`
- Automation: `scripts/cli.py`, `scripts/tasks/sync_openclaw.py`, `scripts/tasks/audit_openclaw_docs.py`, `scripts/tasks/reconcile_cron.py`, `scripts/tasks/setup_config_backup.py`, `scripts/ops/daily-openclaw-backup.sh`
- OpenClaw context:
  - `~/.openclaw/workspace/*`
  - `~/github/openclaw/README.md`
  - embedded `openclaw/` mirror in this repo
- Verification:
  - `UV_CACHE_DIR=/tmp/uv-cache-grimoire-review uv run python -m scripts doctor` ✅
  - `UV_CACHE_DIR=/tmp/uv-cache-grimoire-review uv run python -m scripts openclaw:audit` ❌
  - `UV_CACHE_DIR=/tmp/uv-cache-grimoire-review uv run ruff check .` ❌
  - `bun run typecheck` ❌
