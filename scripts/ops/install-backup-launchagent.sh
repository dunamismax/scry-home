#!/usr/bin/env bash
set -euo pipefail

home_dir="${HOME_DIR:-$HOME}"
label="${BACKUP_AGENT_LABEL:-com.sawyer.scry.backups}"
interval="${BACKUP_INTERVAL_SECONDS:-21600}"
launch_agents_dir="$home_dir/Library/LaunchAgents"
logs_dir="$home_dir/Library/Logs"
plist_path="$launch_agents_dir/$label.plist"
runner_path="${BACKUP_RUNNER_PATH:-$home_dir/github/grimoire/scripts/ops/run-automated-backups.sh}"

if [[ ! "$interval" =~ ^[0-9]+$ ]] || [[ "$interval" -lt 300 ]]; then
  echo "error: BACKUP_INTERVAL_SECONDS must be an integer >= 300"
  exit 1
fi

if [[ ! -x "$runner_path" ]]; then
  echo "error: runner script not found or not executable: $runner_path"
  exit 1
fi

mkdir -p "$launch_agents_dir" "$logs_dir"

cat > "$plist_path" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>$label</string>
    <key>ProgramArguments</key>
    <array>
      <string>$runner_path</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>$interval</integer>
    <key>ProcessType</key>
    <string>Background</string>
    <key>StandardOutPath</key>
    <string>$logs_dir/$label.log</string>
    <key>StandardErrorPath</key>
    <string>$logs_dir/$label.err.log</string>
  </dict>
</plist>
EOF

chmod 644 "$plist_path"

uid="$(id -u)"
launchctl bootout "gui/$uid" "$plist_path" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$uid" "$plist_path"
launchctl enable "gui/$uid/$label"
launchctl kickstart -k "gui/$uid/$label"

echo "installed: $plist_path"
echo "label: $label"
echo "interval_seconds: $interval"
echo "stdout_log: $logs_dir/$label.log"
echo "stderr_log: $logs_dir/$label.err.log"
echo
echo "Optional: store passphrases in Keychain for encrypted backups:"
echo "security add-generic-password -U -a \"$USER\" -s scry-config-backup-passphrase -w 'YOUR_LONG_PASSPHRASE'"
echo "security add-generic-password -U -a \"$USER\" -s scry-ssh-backup-passphrase -w 'YOUR_LONG_PASSPHRASE'"
