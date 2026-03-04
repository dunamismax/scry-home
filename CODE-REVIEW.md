# CODE-REVIEW.md — grimoire

**Date:** 2026-03-03
**Scope:** Full repository review — all TypeScript, shell scripts, configuration, and supporting docs.
**Verification:** `bun run lint`, `bun run typecheck`, and `bun test` (38 tests) all pass clean.

---

## Executive Summary

Grimoire is a well-structured personal ops/identity repo with TypeScript across `scripts/` and `test/`, plus shell scripts and documentation. The code is clean, typed with `strict: true`, formatted with Biome, and passes all static checks. The crypto implementation is solid (AES-256-GCM + PBKDF2 with 250k iterations), now consolidated into a shared `crypto.ts` module. Test coverage targets the highest-risk areas: crypto round-trip, path normalization, markdown parsing, and remote URL validation.

---

## 1. Code Quality

### Strengths

- **Strict TypeScript with Biome.** `strict: true` in tsconfig, Biome recommended rules enabled. Zero lint warnings, zero type errors. Clean baseline.
- **Consistent error handling pattern.** `runOrThrow` in `common.ts` is a solid primitive — captures stdout/stderr, throws on non-zero exit with useful messages. All tasks use it.
- **Clear file organization.** `scripts/cli.py` is a simple dispatch table. Each task is a standalone module in `scripts/tasks/`. Easy to find things.
- **Good operational discipline.** `logStep()` provides scannable output. Backup tasks include fingerprint-based skip-if-unchanged logic. Sync has dry-run mode.
- **Solid crypto choices.** AES-256-GCM, PBKDF2 with 250k iterations, 16-byte salt, 12-byte IV. Auth tags are properly extracted and verified. Magic bytes for format versioning.
- **Shared crypto and snapshot modules.** `scripts/crypto.ts` and `scripts/snapshot.ts` provide single-source-of-truth implementations used by all backup modules.

### Issues (Resolved)

- ~~`_CONFIG_AUTH_TAG_LENGTH` dead declaration~~ — Removed. Auth tag length now lives in shared `crypto.ts`.
- ~~`extractDir` no-op in verify-config-backup.ts~~ — Removed dead variable and branch.
- ~~`bunfig.toml` references nonexistent test infrastructure~~ — Test directory and setup now exist; 38 tests pass.

---

## 2. Architecture

### CLI Design (`scripts/cli.py`)

The dispatch table pattern is straightforward and works well for this scale. A few gaps:

- **No `--help` flag.** Running `python3 -m scripts` with no args shows available commands (good), but there's no per-command help or description.
- **Commands typed as `() => void`.** Several commands could benefit from being async (e.g., if you ever want parallel project installs or async I/O). The type should be `() => void | Promise<void>` with an `await` in the try/catch. Not urgent but blocks future async work.
- **No argument forwarding visibility.** Some tasks read `sys.argv` directly (e.g., `sync_openclaw` checks for `--commit`, `sync_remotes` checks for `--fix`). This works but the CLI entrypoint doesn't document which commands accept flags. A user running `python3 -m scripts sync:openclaw` has to read source to know `--commit` exists.

### Module Boundaries

The separation between `common.ts` (shared utilities), `crypto.ts` (encryption), `snapshot.ts` (fingerprinting), `projects.config.ts` (data), and `tasks/*.ts` (commands) is clean.

- ~~`sync-openclaw.ts` redefines `ensureDir` locally~~ — Now imports from `common.ts`.

---

## 3. TypeScript Patterns

### Good

- Consistent use of `as const` for literal arrays and config objects.
- Proper narrowing with `instanceof Error` in catch blocks.
- `Buffer.from(result.stdout).toString("utf8")` in `common.ts` handles Bun's `Uint8Array` stdout correctly.
- Type-only imports where appropriate.

### Improvement Opportunities

- ~~**`commandExists` function** used shell interpolation~~ — Now uses `shutil.which()`, a direct `$PATH` lookup with no shell.
- **Inconsistent subprocess handling vs `run_or_throw`**: `setup_workstation.py` uses raw `subprocess.run` for `git config --unset-all` (to silently ignore failure), while `sync_remotes.py` wraps the same operation similarly. Pick a pattern — a `run_quiet` or `run_optional` helper that returns success/failure without throwing would clean both up.
- **No shared types for metadata JSON**: Both `setup-config-backup.ts` and `verify-config-backup.ts` parse the same metadata JSON but use inline `as` type assertions. A shared `ConfigBackupMetadata` type would prevent drift.

---

## 4. Code Duplication (Resolved)

### Crypto constants and encryption logic — RESOLVED

Extracted into `scripts/crypto.ts`:
- Single `encrypt(plaintext, passphrase, format)` and `decrypt(payload, passphrase, format)` functions.
- All crypto constants (KDF iterations, key/salt/IV/tag lengths) live in one place.
- `setup-config-backup.ts`, `setup-ssh.ts`, and `verify-config-backup.ts` all use the shared module.

### Snapshot / fingerprint logic — RESOLVED

Extracted into `scripts/snapshot.ts`:
- `sourceSnapshot(root, relativePaths)` for multi-path snapshots (config backup).
- `directorySnapshot(root)` for single-directory snapshots (SSH backup).
- Both backup modules now use the shared implementation.

### Doctor / project health

`doctor.ts:27-64` (managed projects section) and `projects.ts:72-110` (`doctorProjects`) are nearly identical — both iterate projects, check `isGitRepo`, show branch and push URLs. Factor into a shared `projectHealthReport(project)` function.

---

## 5. Hardcoded Paths

| File | Line(s) | Status | Notes |
|---|---|---|---|
| `sync-remotes.ts` | 7 | **RESOLVED** | Now uses `join(homedir(), "github")` |
| `sync-work-desktop.ts` | 31-34 | Open | Google Drive, OneDrive, git paths still hardcoded |
| `setup-workstation.ts` | 13-28 | Open | `FALLBACK_REPOS` list — maintenance burden |

---

## 6. Security

### Solid

- AES-256-GCM with PBKDF2 (250k iterations, SHA-256) for both SSH and config backups. Current best practice for passphrase-based encryption.
- Auth tags properly checked on decrypt. Tampered backups fail cleanly.
- Temp directories cleaned up in `finally` blocks. No plaintext left on disk after operations.
- Encrypted files get `chmod 0o600`. Metadata files get `chmod 0o600`.
- SSH restore normalizes permissions correctly (700 dirs, 600 private keys, 644 public keys).
- Passphrase retrieved from macOS Keychain in the shell script, not hardcoded.
- `.gitignore` properly excludes `.env*`, `*.pem`, `*.key`, `credentials.json`, `vault/`.

### Concerns (Resolved)

- ~~**Command injection surface in `commandExists`**~~ — Replaced with `shutil.which()`. No shell evaluation.
- ~~**Metadata file contains absolute paths**~~ — `sourceHome` now stores `~`, `sourceDir` stores `~/.ssh`, `encryptedBackupFile` stores repo-relative path. No absolute paths with usernames in metadata.

### Remaining Notes

- **No integrity check on backup metadata**: When `setup-config-backup.ts` reads existing metadata to check if backup is current, it trusts the JSON. If metadata were tampered with to match a stale fingerprint, the backup would be skipped. The encrypted backup itself is integrity-protected (GCM auth tag), but the skip-logic trusts unprotected metadata. Low risk since this is a local-only tool, but worth noting.

---

## 7. Testing

Test suite created with 38 tests across 4 files:

| Test file | Coverage area | Tests |
|---|---|---|
| `test/crypto.test.ts` | Encrypt/decrypt round-trip, error cases (wrong passphrase, wrong magic, truncated, tampered) | 9 |
| `test/normalize-path.test.ts` | `normalizeHomeRelativePath` edge cases, `parsePathList`, `buildConfigPathSet` | 14 |
| `test/parse-repos.test.ts` | `parseReposFromIndex` markdown parsing | 6 |
| `test/sync-remotes.test.ts` | `isCorrect` URL matching logic | 6 |

All 38 tests pass. `bunfig.toml` test preload now points to real `test/setup.ts`.

---

## 8. Error Handling

Generally good — `runOrThrow` provides consistent error messages with exit codes and command strings. A few gaps:

- **`sync_openclaw.py`**: Git operations now use `run_or_throw` consistently. Error handling for git commit properly catches "nothing to commit" case.
- **No structured error types.** Everything throws `new Error(message)`. For a CLI this is fine, but if you ever want programmatic error handling (retry logic, error categorization), typed errors would help.
- ~~**`verify-config-backup.ts` misleading temp dir output**~~ — Removed the `preview root: ${tempDir}` line since the directory is deleted in `finally`.

---

## 9. Prioritized Improvements

### P0 — Fix Now (security, correctness) — ALL RESOLVED

1. ~~**Replace `commandExists` shell interpolation with `shutil.which()`**~~ — Done.
2. ~~**Delete dead code**~~ — Done. `_CONFIG_AUTH_TAG_LENGTH` removed, `extractDir` no-op removed.
3. ~~**Metadata absolute paths**~~ — Done. Now stores `~` and repo-relative paths.

### P1 — Near-Term (maintainability) — ALL RESOLVED

4. ~~**Extract shared crypto module**~~ — Done. `scripts/crypto.ts` created.
5. ~~**Extract shared snapshot/fingerprint module**~~ — Done. `scripts/snapshot.ts` created.
6. ~~**Remove `bunfig.toml` test preload / create tests**~~ — Done. 38 tests across 4 files.
7. ~~**Fix `sync-openclaw.ts` local `ensureDir`**~~ — Done. Imports from `common.ts`.
8. ~~**Eliminate hardcoded path in `sync-remotes.ts`**~~ — Done. Uses `homedir()`.

### P2 — Polish (developer experience)

9. **Add per-command `--help` output** or at minimum document flags in the CLI help text.
10. **Add `runOptional` helper** to `common.ts` for commands where failure is expected (git config --unset-all).
11. **Factor `doctorProjects` / doctor managed-projects section** into shared function.
12. **Make `sync-work-desktop.ts` paths configurable** via env vars instead of hardcoded constants.

### P3 — Strategic (quality investment)

13. **Shared metadata types** — `ConfigBackupMetadata` and `SshBackupMetadata` as exported interfaces.
14. **Consider async CLI dispatch** — type commands as `() => void | Promise<void>` for future flexibility.
15. **Expand test coverage** — add snapshot module tests, CLI integration tests.

---

## 10. Dependency Health

```json
"devDependencies": {
  "@biomejs/biome": "^2.4.5",
  "@types/node": "^24.3.0",
  "bun-types": "^1.3.9",
  "typescript": "^5.9.2"
}
```

Zero runtime dependencies. Dev dependencies are minimal and appropriate. No supply chain concerns. The `^` ranges mean `bun install` will pull latest compatible — fine for a private repo.

---

## 11. Documentation

Documentation quality is high. `SOUL.md` and `AGENTS.md` are thorough and well-structured. `README.md` covers setup and available scripts. `BUILD.md` exists but is still in Phase 0 planning with no real content. `CONTRIBUTING_TO_OPENCLAW.md` provides a detailed field guide.

The `prompts/` directory contains 9 detailed prompt templates — these are well-written project specs. They're documentation, not executable code, so no code quality issues apply.

One gap: there's no `CHANGELOG.md` or version tagging strategy. For a personal ops repo this is low priority, but `package.json` version is `0.1.0` with no evidence of version bumps.

---

## Summary Table

| Category | Rating | Notes |
|---|---|---|
| Type safety | Strong | `strict: true`, zero errors |
| Linting | Clean | Biome recommended, zero warnings |
| Test coverage | Good | 38 tests across 4 files — crypto, paths, parsing, remotes |
| Security | Strong | Shared crypto module, no injection vectors, no absolute paths in metadata |
| Code duplication | Low | Crypto and snapshot logic consolidated into shared modules |
| Error handling | Good | Consistent pattern, minor gaps |
| Documentation | Strong | Thorough identity/ops docs |
| Dependencies | Excellent | Zero runtime deps, minimal dev deps |
| Hardcoded paths | 1 file | sync-work-desktop.ts (P2) |
