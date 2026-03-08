#!/bin/zsh
set -euo pipefail

SERVICE_NAME="scry.openclaw.config-backup.passphrase"
ACCOUNT_NAME="${USER}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_DIR="${HOME}/Library/Logs/scry"
LOG_FILE="${LOG_DIR}/openclaw-critical-backup.log"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export UV_CACHE_DIR="${UV_CACHE_DIR:-${TMPDIR:-/tmp}/uv-cache-scry-home}"

mkdir -p "${LOG_DIR}"

exec >>"${LOG_FILE}" 2>&1

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] starting openclaw critical backup"

if [[ ! -d "${REPO_ROOT}" ]]; then
  echo "repo not found: ${REPO_ROOT}"
  exit 1
fi

PASSPHRASE="$(security find-generic-password -a "${ACCOUNT_NAME}" -s "${SERVICE_NAME}" -w 2>/dev/null || true)"
if [[ -z "${PASSPHRASE}" ]]; then
  echo "missing keychain secret: ${SERVICE_NAME} for account ${ACCOUNT_NAME}"
  echo "seed with: security add-generic-password -U -a \"$USER\" -s \"${SERVICE_NAME}\" -w '<passphrase>'"
  exit 1
fi

cd "${REPO_ROOT}"

export SCRY_CONFIG_BACKUP_PASSPHRASE="${PASSPHRASE}"
export SCRY_CONFIG_EXTRA_PATHS=".openclaw/agents
.openclaw/memory
.openclaw/subagents
.openclaw/cron
.openclaw/delivery-queue"

run_repo_task() {
  local command="$1"
  shift || true
  uv run --project "${REPO_ROOT}" python "${REPO_ROOT}/scripts/cli.py" "${command}" "$@"
}

run_repo_task setup:config_backup
run_repo_task verify:config_backup
run_repo_task sync:openclaw --commit

META_FILE="${REPO_ROOT}/vault/config/critical-configs.meta.json"
if [[ -f "${META_FILE}" ]]; then
  CREATED_AT="$(uv run python - "${META_FILE}" <<'PY'
import json,sys
p=sys.argv[1]
with open(p,'r',encoding='utf-8') as f:
    data=json.load(f)
print(data.get('createdAt','unknown'))
PY
)"
  echo "latest encrypted config backup metadata timestamp: ${CREATED_AT}"
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] backup run complete"
