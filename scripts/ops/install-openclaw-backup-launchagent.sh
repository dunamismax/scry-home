#!/bin/zsh
set -euo pipefail

LABEL="com.scry.openclaw.backup"
PLIST_PATH="${HOME}/Library/LaunchAgents/${LABEL}.plist"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT_PATH="${REPO_ROOT}/scripts/ops/daily-openclaw-backup.sh"
LOG_DIR="${HOME}/Library/Logs/scry"

mkdir -p "${HOME}/Library/LaunchAgents" "${LOG_DIR}"

cat > "${PLIST_PATH}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>${SCRIPT_PATH}</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${REPO_ROOT}</string>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>2</integer>
    <key>Minute</key>
    <integer>20</integer>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>StandardOutPath</key>
  <string>${LOG_DIR}/openclaw-backup.launchd.out.log</string>

  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/openclaw-backup.launchd.err.log</string>
</dict>
</plist>
EOF

chmod 600 "${PLIST_PATH}"
chmod 700 "${SCRIPT_PATH}"

launchctl bootout "gui/$(id -u)/${LABEL}" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "${PLIST_PATH}"
launchctl enable "gui/$(id -u)/${LABEL}"
launchctl kickstart -k "gui/$(id -u)/${LABEL}"

echo "installed and started ${LABEL}"
echo "plist: ${PLIST_PATH}"
echo "script: ${SCRIPT_PATH}"
