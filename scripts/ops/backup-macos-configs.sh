#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
dest_root="$repo_root/workstation/macOS"
home_dir="${HOME_DIR:-$HOME}"

# Ensure inventory generation works even on a fresh clone.
mkdir -p "$dest_root/home" "$dest_root/etc" "$dest_root/metadata"

copy_file() {
  local src="$1"
  local dest="$2"

  if [[ ! -f "$src" ]]; then
    echo "MISS  $src"
    return 0
  fi

  mkdir -p "$(dirname "$dest")"
  if [[ -e "$dest" && ! -w "$dest" ]]; then
    chmod u+w "$dest"
  fi
  cp "$src" "$dest"
  chmod u+w "$dest" 2>/dev/null || true
  echo "COPY  $src -> $dest"
}

copy_dir() {
  local src="$1"
  local dest="$2"

  if [[ ! -d "$src" ]]; then
    echo "MISS  $src"
    return 0
  fi

  mkdir -p "$dest"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --chmod=Fu+w "$src/" "$dest/"
  else
    find "$dest" -mindepth 1 -exec rm -rf {} +
    cp -R "$src/." "$dest/"
    chmod -R u+w "$dest" 2>/dev/null || true
  fi
  echo "COPYD $src -> $dest"
}

copy_home() {
  local relative="$1"
  copy_file "$home_dir/$relative" "$dest_root/home/$relative"
}

copy_home_dir() {
  local relative="$1"
  copy_dir "$home_dir/$relative" "$dest_root/home/$relative"
}

copy_home_dir_files() {
  local src_dir="$1"
  local rel_dir="$2"
  local found="false"

  if [[ ! -d "$home_dir/$src_dir" ]]; then
    echo "MISS  $home_dir/$src_dir"
    return 0
  fi

  while IFS= read -r -d '' src; do
    found="true"
    copy_file "$src" "$dest_root/home/$rel_dir/$(basename "$src")"
  done < <(find "$home_dir/$src_dir" -maxdepth 1 -type f -print0 | sort -z)

  if [[ "$found" == "false" ]]; then
    echo "MISS  $home_dir/$src_dir/*"
  fi
}

copy_etc() {
  local src="$1"
  local rel="$2"
  copy_file "$src" "$dest_root/etc/$rel"
}

copy_etc_dir_files() {
  local src_dir="$1"
  local rel_dir="$2"
  local found="false"

  if [[ ! -d "$src_dir" ]]; then
    echo "MISS  $src_dir"
    return 0
  fi

  while IFS= read -r -d '' src; do
    found="true"
    copy_file "$src" "$dest_root/etc/$rel_dir/$(basename "$src")"
  done < <(find "$src_dir" -maxdepth 1 -type f -print0 | sort -z)

  if [[ "$found" == "false" ]]; then
    echo "MISS  $src_dir/*"
  fi
}

drop_sensitive_backup() {
  local target="$1"

  if [[ ! -e "$target" ]]; then
    return 0
  fi

  chmod -R u+w "$target" 2>/dev/null || true
  rm -rf "$target"
  echo "DROP  removed unsanitized sensitive backup $target"
}

sanitize_with_python() {
  local mode="$1"
  local target="$2"

  if [[ ! -e "$target" ]]; then
    return 0
  fi

  if ! (
    cd "$repo_root"
    uv run python - "$mode" "$target" <<'PY'
import json
import plistlib
import re
import sys
from pathlib import Path

SECRET_KEY_RE = re.compile(
    r"(?i)(token|secret|password|passphrase|api[_-]?key|access[_-]?key|private[_-]?key|credential)"
)
PHONE_RE = re.compile(r"^\+?\d{10,15}$")
RULE_SECRET_RE = re.compile(
    r'((?:[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSPHRASE|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|CREDENTIAL)[A-Z0-9_]*)=)(?:\\"[^\\"]*\\"|[^", \\\\]+)',
    re.IGNORECASE,
)
URL_SECRET_RE = re.compile(r"(://[^:/\", ]+:)[^@/\", ]+@", re.IGNORECASE)


def scrub(value):
    if isinstance(value, dict):
        return {
            key: "__REDACTED__" if SECRET_KEY_RE.search(key) else scrub(child)
            for key, child in value.items()
        }
    if isinstance(value, list):
        return [scrub(child) for child in value]
    if isinstance(value, str) and PHONE_RE.match(value):
        return "__REDACTED__"
    return value


def write_json(path: Path, payload):
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def sanitize_docker(path: Path):
    payload = json.loads(path.read_text(encoding="utf-8"))
    auths = payload.get("auths")
    if isinstance(auths, dict) and auths:
        payload["auths"] = {}
    write_json(path, payload)


def sanitize_openclaw(path: Path):
    payload = json.loads(path.read_text(encoding="utf-8"))
    write_json(path, scrub(payload))


def sanitize_rules(path: Path):
    content = path.read_text(encoding="utf-8")
    content = RULE_SECRET_RE.sub(r"\1__REDACTED__", content)
    content = URL_SECRET_RE.sub(r"\1__REDACTED__@", content)
    path.write_text(content, encoding="utf-8")


def sanitize_plist(path: Path):
    with path.open("rb") as handle:
        payload = plistlib.load(handle)

    def scrub_plist(value):
        if isinstance(value, dict):
            result = {}
            for key, child in value.items():
                if SECRET_KEY_RE.search(str(key)) and isinstance(child, str):
                    result[key] = "__REDACTED__"
                else:
                    result[key] = scrub_plist(child)
            return result
        if isinstance(value, list):
            return [scrub_plist(child) for child in value]
        return value

    with path.open("wb") as handle:
        plistlib.dump(scrub_plist(payload), handle, sort_keys=False)


MODE = sys.argv[1]
TARGET = Path(sys.argv[2])

if MODE == "docker":
    sanitize_docker(TARGET)
elif MODE == "openclaw":
    sanitize_openclaw(TARGET)
elif MODE == "rules":
    sanitize_rules(TARGET)
elif MODE == "plist":
    sanitize_plist(TARGET)
else:
    raise SystemExit(f"unsupported sanitizer mode: {MODE}")
PY
  ); then
    echo "ERROR failed to sanitize $target" >&2
    drop_sensitive_backup "$target"
    return 1
  fi

  return 0
}

# User-level configs
copy_home ".gitconfig"
copy_home ".zshrc"
copy_home ".zprofile"
copy_home ".zshenv"
copy_home ".bashrc"
copy_home ".bash_profile"
copy_home ".profile"
copy_home ".inputrc"
copy_home ".tmux.conf"
copy_home ".vimrc"
copy_home ".npmrc"
copy_home ".bunfig.toml"
copy_home ".ssh/config"
copy_home ".docker/daemon.json"
copy_home ".docker/config.json"
copy_home ".codex/config.toml"
copy_home_dir ".codex/rules"
copy_home ".claude/settings.json"
copy_home ".openclaw/openclaw.json"
copy_home ".openclaw/cron/jobs.json"
copy_home ".config/htop/htoprc"
copy_home ".config/jgit/config"
copy_home "Library/Application Support/com.mitchellh.ghostty/config"
copy_home "Library/Application Support/Code/User/settings.json"
copy_home "Library/Application Support/Code/User/tasks.json"
copy_home "Library/Application Support/Code/User/mcp.json"
copy_home "Library/Application Support/Code/User/chatLanguageModels.json"
copy_home "Library/Application Support/Code/User/keybindings.json"
copy_home_dir "Library/Application Support/Code/User/snippets"
copy_home "Library/Application Support/Code - Insiders/User/settings.json"
copy_home "Library/Application Support/Code - Insiders/User/tasks.json"
copy_home "Library/Application Support/Code - Insiders/User/mcp.json"
copy_home "Library/Application Support/Code - Insiders/User/chatLanguageModels.json"
copy_home "Library/Application Support/Code - Insiders/User/keybindings.json"
copy_home_dir "Library/Application Support/Code - Insiders/User/snippets"
copy_home_dir_files "Library/LaunchAgents" "Library/LaunchAgents"

# System-level configs
copy_etc "/etc/zshrc" "zshrc"
copy_etc "/etc/zprofile" "zprofile"
copy_etc "/etc/bashrc" "bashrc"
copy_etc "/etc/hosts" "hosts"
copy_etc "/etc/shells" "shells"
copy_etc "/etc/ssh/ssh_config" "ssh/ssh_config"
copy_etc "/etc/ssh/sshd_config" "ssh/sshd_config"
copy_etc "/etc/ssh/ssh_config.d/100-macos.conf" "ssh/ssh_config.d/100-macos.conf"
copy_etc "/etc/ssh/sshd_config.d/100-macos.conf" "ssh/sshd_config.d/100-macos.conf"
copy_etc "/etc/ssh/crypto.conf" "ssh/crypto.conf"
copy_etc "/etc/pam.d/sudo" "pam.d/sudo"
copy_etc_dir_files "/etc/sudoers.d" "sudoers.d"

# Redact Docker auths if present.
docker_cfg="$dest_root/home/.docker/config.json"
if [[ -f "$docker_cfg" ]]; then
  sanitize_with_python "docker" "$docker_cfg"
  echo "NOTE  sanitized Docker config in $docker_cfg"
fi

# Redact sensitive values in OpenClaw config if present.
openclaw_cfg="$dest_root/home/.openclaw/openclaw.json"
if [[ -f "$openclaw_cfg" ]]; then
  sanitize_with_python "openclaw" "$openclaw_cfg"
  echo "NOTE  redacted sensitive keys in $openclaw_cfg"
fi

# Redact secret-like env values in Codex rules.
codex_rules_dir="$dest_root/home/.codex/rules"
if [[ -d "$codex_rules_dir" ]]; then
  while IFS= read -r -d '' rules_file; do
    sanitize_with_python "rules" "$rules_file"
    echo "NOTE  redacted secret-like values in $rules_file"
  done < <(find "$codex_rules_dir" -type f -name "*.rules" -print0 2>/dev/null)
fi

# Redact token-like env values in LaunchAgent plists.
if [[ -d "$dest_root/home/Library/LaunchAgents" ]]; then
  while IFS= read -r -d '' plist; do
    sanitize_with_python "plist" "$plist"
    echo "NOTE  redacted token-like plist values in $plist"
  done < <(find "$dest_root/home/Library/LaunchAgents" -maxdepth 1 -type f -name "*.plist" -print0 2>/dev/null)
fi

# Backup inventory
inventory="$dest_root/metadata/backup-inventory.txt"
{
  echo "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "host=__REDACTED__"
  echo "user=__REDACTED__"
  echo "source_home=~"
  echo "repo_root=~/github/grimoire"
  echo
  echo "files_present:"
  find "$dest_root/home" "$dest_root/etc" -type f | sed "s|$repo_root/||" | sort
} > "$inventory"

echo "DONE  macOS config backup refreshed"
