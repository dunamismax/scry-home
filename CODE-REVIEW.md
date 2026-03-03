# CODE-REVIEW.md — grimoire

**Date:** 2026-03-03
**Scope:** Full repository review — all TypeScript, shell scripts, configuration, and supporting docs.
**Verification:** `bun run lint` and `bun run typecheck` both pass clean (0 errors, 0 warnings).

---

## Executive Summary

Grimoire is a well-structured personal ops/identity repo with ~2,450 lines of TypeScript across 13 files, plus shell scripts and documentation. The code is clean, typed with `strict: true`, formatted with Biome, and passes all static checks. The crypto implementation is solid (AES-256-GCM + PBKDF2 with 250k iterations). The main issues are: significant code duplication between backup modules, zero test coverage, some hardcoded paths, a minor command injection surface, and a few dead code artifacts. Nothing is on fire; this is maintenance and hardening work.

---

## 1. Code Quality

### Strengths

- **Strict TypeScript with Biome.** `strict: true` in tsconfig, Biome recommended rules enabled. Zero lint warnings, zero type errors. Clean baseline.
- **Consistent error handling pattern.** `runOrThrow` in `common.ts` is a solid primitive — captures stdout/stderr, throws on non-zero exit with useful messages. All tasks use it.
- **Clear file organization.** `scripts/cli.ts` is a simple dispatch table. Each task is a standalone module in `scripts/tasks/`. Easy to find things.
- **Good operational discipline.** `logStep()` provides scannable output. Backup tasks include fingerprint-based skip-if-unchanged logic. Sync has dry-run mode.
- **Solid crypto choices.** AES-256-GCM, PBKDF2 with 250k iterations, 16-byte salt, 12-byte IV. Auth tags are properly extracted and verified. Magic bytes for format versioning.

### Issues

**Dead code / unused declarations:**

- `scripts/tasks/setup-config-backup.ts:32` — `_CONFIG_AUTH_TAG_LENGTH = 16` is declared with underscore prefix (convention for intentionally unused) but is actually needed for format documentation. The backup module never uses it because `cipher.getAuthTag()` handles the length implicitly, but the restore module (`verify-config-backup.ts:18`) declares its own `CONFIG_AUTH_TAG_LENGTH = 16` without the underscore. Pick one canonical location.
- `scripts/tasks/verify-config-backup.ts:106` — `extractDir` is declared but the conditional block at line 139-141 is a no-op comment:
  ```ts
  if (!existsSync(extractDir)) {
    // no-op, extraction is directly into tempDir...
  }
  ```
  Delete the variable and the dead branch.

**`bunfig.toml` references nonexistent test infrastructure:**
```toml
[test]
preload = ["./test/setup.ts"]
```
There is no `test/` directory. This won't cause errors (Bun only loads it when running `bun test`), but it's misleading and signals abandoned scaffolding.

---

## 2. Architecture

### CLI Design (`scripts/cli.ts`)

The dispatch table pattern is straightforward and works well for this scale. A few gaps:

- **No `--help` flag.** Running `bun run scripts/cli.ts` with no args shows available commands (good), but there's no per-command help or description.
- **Commands typed as `() => void`.** Several commands could benefit from being async (e.g., if you ever want parallel project installs or async I/O). The type should be `() => void | Promise<void>` with an `await` in the try/catch. Not urgent but blocks future async work.
- **No argument forwarding visibility.** Some tasks read `Bun.argv` directly (e.g., `sync-openclaw` checks for `--commit`, `sync-remotes` checks for `--fix`). This works but the CLI entrypoint doesn't document which commands accept flags. A user running `bun run scry:sync:openclaw` has to read source to know `--commit` exists.

### Module Boundaries

The separation between `common.ts` (shared utilities), `projects.config.ts` (data), and `tasks/*.ts` (commands) is clean. One violation:

- `sync-openclaw.ts:85-87` redefines `ensureDir` locally instead of importing from `common.ts`. The implementations are identical (`mkdirSync(path, { recursive: true })`). Use the shared one.

---

## 3. TypeScript Patterns

### Good

- Consistent use of `as const` for literal arrays and config objects.
- Proper narrowing with `instanceof Error` in catch blocks.
- `Buffer.from(result.stdout).toString("utf8")` in `common.ts` handles Bun's `Uint8Array` stdout correctly.
- Type-only imports where appropriate.

### Improvement Opportunities

- **`commandExists` function** (`common.ts:63-70`): Spawns a full login shell (`bash -lc`) just to check `command -v`. This is significantly heavier than needed — a login shell loads `.bash_profile`, `.bashrc`, etc. A non-login `bash -c` would suffice for most binaries, or better yet, use `Bun.which(binary)` which is a direct `$PATH` lookup with no shell overhead.
- **Inconsistent `Bun.spawnSync` vs `runOrThrow`**: `setup-workstation.ts:144-155` uses raw `Bun.spawnSync` for `git config --unset-all` (to silently ignore failure), while `sync-remotes.ts:47-53` wraps the same operation in a try/catch around `runOrThrow`. Pick a pattern — a `runQuiet` or `runOptional` helper that returns success/failure without throwing would clean both up.
- **No shared types for metadata JSON**: Both `setup-config-backup.ts` and `verify-config-backup.ts` parse the same metadata JSON but use inline `as` type assertions. A shared `ConfigBackupMetadata` type would prevent drift.

---

## 4. Code Duplication (Tech Debt)

This is the largest structural issue.

### Crypto constants and encryption logic

`setup-config-backup.ts` and `setup-ssh.ts` independently define:
- KDF iterations, key length, salt length, IV length, auth tag length, format magic
- Encryption flow (salt + IV + key derivation + cipher + concat payload)
- Decryption flow (parse magic + salt + IV + authTag + ciphertext + decrypt)
- Snapshot/fingerprint logic (walk tree, hash files, compute aggregate fingerprint)

These should be extracted into a shared `crypto.ts` module with:
- A single `encrypt(plaintext: Buffer, passphrase: string, magic: string): Buffer`
- A single `decrypt(payload: Buffer, passphrase: string, magic: string): Buffer`
- Shared constants (or a config object per backup type)

**Estimated savings:** ~120 lines removed, single point of maintenance for crypto parameters.

### Snapshot / fingerprint logic

`setup-config-backup.ts:142-202` (`addSnapshotEntries` + `sourceSnapshot`) and `setup-ssh.ts:38-88` (`sourceSnapshot` with inner `walk`) do the same thing with slightly different signatures. Extract into `common.ts` or a new `snapshot.ts`.

### Doctor / project health

`doctor.ts:27-64` (managed projects section) and `projects.ts:72-110` (`doctorProjects`) are nearly identical — both iterate projects, check `isGitRepo`, show branch and push URLs. Factor into a shared `projectHealthReport(project)` function.

---

## 5. Hardcoded Paths

Several files contain hardcoded absolute paths:

| File | Line(s) | Hardcoded Value | Should Be |
|---|---|---|---|
| `sync-remotes.ts` | 7 | `"/Users/sawyer/github"` | `join(homedir(), "github")` or env var |
| `sync-work-desktop.ts` | 31-34 | Google Drive, OneDrive, git paths | Env vars with defaults |
| `setup-workstation.ts` | 13-28 | `FALLBACK_REPOS` list | Not a path issue, but this is a maintenance burden — consider a `.json` or reading from the profile repo |

The `sync-remotes.ts` hardcoded path is the most problematic — it breaks if the repo root ever changes or if the script is run on a different machine. Every other task in the repo properly uses `homedir()` or env vars.

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

### Concerns

**Command injection surface in `commandExists`** (`common.ts:65`):
```ts
cmd: ["bash", "-lc", `command -v ${binary} >/dev/null 2>&1`]
```
The `binary` parameter is interpolated into a shell command string. If `binary` ever contained shell metacharacters (e.g., `; rm -rf /`), this would execute arbitrary commands. Current callers only pass string literals (`"bun"`, `"git"`, `"tar"`, etc.), so this is not exploitable today, but it's a latent injection vector. Fix: use `Bun.which(binary)` instead, which does a direct `$PATH` lookup with no shell evaluation.

**Metadata file contains absolute paths** (`vault/config/critical-configs.meta.json`):
Fields like `sourceHome`, `encryptedBackupFile` contain full filesystem paths (`/Users/sawyer/...`). Per the data classification in AGENTS.md, these are "Internal" tier (file paths with usernames). The metadata file itself is `.gitignore`'d via `vault/`, but the committed `critical-configs.meta.json` at `vault/config/` appears to be tracked. Verify this is intentional — the file currently contains the home directory username.

**No integrity check on backup metadata**: When `setup-config-backup.ts` reads existing metadata to check if backup is current (line 251), it trusts the JSON. If metadata were tampered with to match a stale fingerprint, the backup would be skipped. The encrypted backup itself is integrity-protected (GCM auth tag), but the skip-logic trusts unprotected metadata. Low risk since this is a local-only tool, but worth noting.

---

## 7. Testing

**There are zero tests.** No `test/` directory exists despite `bunfig.toml` referencing `./test/setup.ts`.

Priority test targets (highest value per effort):
1. **Crypto round-trip** — encrypt then decrypt, verify plaintext matches. This is the most important thing to not break silently.
2. **`normalizeHomeRelativePath`** — path traversal prevention. Edge cases: `../etc/passwd`, empty string, null bytes, `~/../../`.
3. **`parseReposFromIndex`** — markdown parsing. Test with malformed input, empty input, no `## Repositories` section.
4. **`buildConfigPathSet`** — env var parsing for extra/exclude paths.
5. **`isCorrect` in sync-remotes** — URL matching logic.

---

## 8. Error Handling

Generally good — `runOrThrow` provides consistent error messages with exit codes and command strings. A few gaps:

- **`sync-openclaw.ts:218-226`**: Uses raw `Bun.spawnSync` for git operations instead of `runOrThrow`, with minimal error messages (`"git add failed"` with no stderr output). The git commit error handling properly captures stderr, but git add doesn't.
- **No structured error types.** Everything throws `new Error(message)`. For a CLI this is fine, but if you ever want programmatic error handling (retry logic, error categorization), typed errors would help.
- **`verify-config-backup.ts` temp dir cleanup**: The `finally` block at line 143 always deletes the temp dir. The success output at line 135 prints `preview root: ${tempDir}` — but that directory is already gone by the time the user sees it. Misleading output.

---

## 9. Prioritized Improvements

### P0 — Fix Now (security, correctness)

1. **Replace `commandExists` shell interpolation with `Bun.which()`** — eliminates command injection surface, is faster, and is more idiomatic.
2. **Delete dead code** — remove `_CONFIG_AUTH_TAG_LENGTH` underscore prefix (or move to shared module), remove `extractDir` no-op in verify-config-backup.

### P1 — Near-Term (maintainability)

3. **Extract shared crypto module** — deduplicate encryption/decryption between setup-config-backup.ts, setup-ssh.ts, and verify-config-backup.ts. Single point of maintenance.
4. **Extract shared snapshot/fingerprint module** — same dedup story.
5. **Remove `bunfig.toml` test preload** or create the test directory with at least a crypto round-trip test.
6. **Fix `sync-openclaw.ts` local `ensureDir`** — import from common.ts instead of redefining.
7. **Eliminate hardcoded path in `sync-remotes.ts`** — use `homedir()` or env var.

### P2 — Polish (developer experience)

8. **Add per-command `--help` output** or at minimum document flags in the CLI help text.
9. **Add `runOptional` helper** to `common.ts` for commands where failure is expected (git config --unset-all).
10. **Factor `doctorProjects` / doctor managed-projects section** into shared function.
11. **Make `sync-work-desktop.ts` paths configurable** via env vars instead of hardcoded constants.
12. **Fix misleading temp dir output** in verify-config-backup.ts (don't print the path since it's deleted in `finally`).

### P3 — Strategic (quality investment)

13. **Add test suite** — start with crypto round-trip and path normalization. These are the highest-risk areas.
14. **Shared metadata types** — `ConfigBackupMetadata` and `SshBackupMetadata` as exported interfaces.
15. **Consider async CLI dispatch** — type commands as `() => void | Promise<void>` for future flexibility.

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
| Test coverage | None | Zero tests, highest-priority gap |
| Security | Good | Solid crypto, one latent injection vector |
| Code duplication | Moderate | ~250 lines of crypto/snapshot duplication |
| Error handling | Good | Consistent pattern, minor gaps |
| Documentation | Strong | Thorough identity/ops docs |
| Dependencies | Excellent | Zero runtime deps, minimal dev deps |
| Hardcoded paths | 2 files | sync-remotes.ts, sync-work-desktop.ts |
