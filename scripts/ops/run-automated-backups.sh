#!/usr/bin/env bash
set -euo pipefail

home_dir="${HOME_DIR:-$HOME}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root_default="$(cd "$script_dir/../.." && pwd)"
repo_root="${SCRY_REPO:-$repo_root_default}"
config_service="${SCRY_CONFIG_BACKUP_KEYCHAIN_SERVICE:-scry-config-backup-passphrase}"
ssh_service="${SCRY_SSH_BACKUP_KEYCHAIN_SERVICE:-scry-ssh-backup-passphrase}"

path_default="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export PATH="$path_default:${PATH:-}"
export UV_CACHE_DIR="${UV_CACHE_DIR:-${TMPDIR:-/tmp}/uv-cache-scry-home}"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

lock_dir="${TMPDIR:-/tmp}/scry-home-backup.lock"
lock_stale_seconds=3600

if ! mkdir "$lock_dir" 2>/dev/null; then
  if [[ -d "$lock_dir" ]]; then
    lock_age=$(( $(date +%s) - $(stat -f %m "$lock_dir" 2>/dev/null || echo 0) ))
    if (( lock_age > lock_stale_seconds )); then
      log "warn: removing stale lock (${lock_age}s old)"
      rmdir "$lock_dir" 2>/dev/null || rm -rf "$lock_dir"
      mkdir "$lock_dir" 2>/dev/null || { log "skip: could not acquire lock"; exit 0; }
    else
      log "skip: backup already running (lock is ${lock_age}s old)"
      exit 0
    fi
  else
    log "skip: backup already running"
    exit 0
  fi
fi
trap 'rmdir "$lock_dir" >/dev/null 2>&1 || true' EXIT

get_keychain_secret() {
  local service="$1"
  security find-generic-password -a "$USER" -s "$service" -w 2>/dev/null || true
}

run_macos_snapshot() {
  local script="$repo_root/scripts/ops/backup-macos-configs.sh"
  if [[ ! -x "$script" ]]; then
    log "warn: missing executable: $script"
    return 0
  fi

  log "start: tracked macOS config snapshot"
  bash "$script"
  log "done: tracked macOS config snapshot"
}

run_repo_task() {
  local name="$1"
  local command="$2"
  local passphrase="$3"
  local env_var="$4"

  if [[ ! -f "$repo_root/pyproject.toml" ]]; then
    log "warn: missing repo root at $repo_root; skipping $name"
    return 0
  fi

  if [[ "${#passphrase}" -lt 16 ]]; then
    log "warn: passphrase unavailable for $name; skipping"
    return 0
  fi

  log "start: $name"
  (
    cd "$repo_root"
    export "$env_var=$passphrase"
    uv run python -m scripts "$command"
  )
  log "done: $name"
}

log "backup run starting"

run_macos_snapshot

config_passphrase="${SCRY_CONFIG_BACKUP_PASSPHRASE:-$(get_keychain_secret "$config_service")}"
ssh_passphrase="${SCRY_SSH_BACKUP_PASSPHRASE:-$(get_keychain_secret "$ssh_service")}"

run_repo_task "encrypted config backup" "setup:config_backup" "$config_passphrase" "SCRY_CONFIG_BACKUP_PASSPHRASE"
run_repo_task "encrypted config backup verification" "verify:config_backup" "$config_passphrase" "SCRY_CONFIG_BACKUP_PASSPHRASE"
run_repo_task "encrypted ssh backup" "setup:ssh_backup" "$ssh_passphrase" "SCRY_SSH_BACKUP_PASSPHRASE"

log "backup run complete"
