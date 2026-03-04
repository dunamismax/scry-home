#!/bin/zsh
set -euo pipefail

SERVICE_NAME="scry.openclaw.config-backup.passphrase"
ACCOUNT_NAME="${USER}"
REPO_ROOT="${HOME}/github/grimoire"
LOG_DIR="${HOME}/Library/Logs/scry"
LOG_FILE="${LOG_DIR}/openclaw-critical-backup.log"

export PATH="${HOME}/.bun/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

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
python3 -m scripts setup:config_backup
python3 -m scripts verify:config_backup
python3 -m scripts sync:openclaw --commit

META_FILE="${REPO_ROOT}/vault/config/critical-configs.meta.json"
if [[ -f "${META_FILE}" ]]; then
  CREATED_AT="$(python3 - "${META_FILE}" <<'PY'
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
