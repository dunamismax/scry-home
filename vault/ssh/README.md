# SSH Vault

This directory stores an **encrypted** backup of `~/.ssh` for workstation recovery.

Files:

- `ssh-keys.tar.enc`: encrypted archive created by `bun run setup:ssh:backup`
- `ssh-keys.meta.json`: metadata for the encrypted archive (timestamp, host, cipher/KDF)

Usage:

```bash
# Create/update encrypted backup
export SCRY_SSH_BACKUP_PASSPHRASE='use-a-long-unique-passphrase'
bun run setup:ssh:backup

# Restore on a new system
export SCRY_SSH_BACKUP_PASSPHRASE='use-a-long-unique-passphrase'
bun run setup:ssh:restore
```

Notes:

- Never store unencrypted private keys in this repository.
- `SCRY_SSH_BACKUP_PASSPHRASE` should be at least 16 characters.
- Backup encryption uses authenticated encryption (`AES-256-GCM`) with PBKDF2-SHA256 key derivation.
- Restore keeps backward compatibility for legacy OpenSSL-CBC archives created by older script versions.
- Re-running `bun run setup:ssh:backup` is idempotent: if `~/.ssh` is unchanged, backup files are not rewritten.
- `bun run setup:ssh:restore` replaces `~/.ssh` with the encrypted backup contents, then enforces permissions and managed git host config entries.
- Optional overrides:
  - `SCRY_SSH_BACKUP_FILE` to read/write a non-default encrypted archive path.
  - `SCRY_SSH_METADATA_FILE` to write metadata to a non-default path.
  - `SCRY_GITHUB_IDENTITY` and `SCRY_CODEBERG_IDENTITY` to override managed `IdentityFile` values during restore.
