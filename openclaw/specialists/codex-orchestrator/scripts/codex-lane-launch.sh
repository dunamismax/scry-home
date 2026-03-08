#!/usr/bin/env bash
set -euo pipefail

LANE_NAME="${1:-}"
REPO_DIR="${2:-}"
PROMPT_FILE="${3:-}"
REASONING="${4:-high}"
SANDBOX="${5:-workspace-write}"
EXTRA_ARGS=()
if (( $# > 5 )); then
  EXTRA_ARGS=("${@:6}")
fi

if [[ -z "$LANE_NAME" || -z "$REPO_DIR" || -z "$PROMPT_FILE" ]]; then
  echo "Usage: $0 <lane-name> <repo-dir> <prompt-file> [reasoning] [sandbox]" >&2
  exit 2
fi

if [[ ! -d "$REPO_DIR" ]]; then
  echo "Repo dir not found: $REPO_DIR" >&2
  exit 2
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Prompt file not found: $PROMPT_FILE" >&2
  exit 2
fi

WS="/Users/sawyer/.openclaw/workspace-codex-orchestrator"
RUNS_DIR="$WS/runs"
CODEX_BATCH_DIR="${CODEX_BATCH_DIR:-}"
mkdir -p "$RUNS_DIR"

slug=$(printf '%s' "$LANE_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//')
if [[ -z "$slug" ]]; then
  slug="lane"
fi

ts=$(date -u +%Y%m%dT%H%M%SZ)
RUN_DIR="$RUNS_DIR/$ts-$slug"
mkdir -p "$RUN_DIR"

cp "$PROMPT_FILE" "$RUN_DIR/prompt.md"
PROMPT_CONTENT=$(cat "$PROMPT_FILE")
PROMPT_SHA256=$(shasum -a 256 "$PROMPT_FILE" | awk '{print $1}')
PROMPT_BYTES=$(wc -c < "$PROMPT_FILE" | tr -d ' ')
STDOUT_LOG="$RUN_DIR/stdout.log"
FINAL_FILE="$RUN_DIR/final.md"
EXIT_FILE="$RUN_DIR/exit-code.txt"
MANIFEST="$RUN_DIR/manifest.json"

REPO_TOPLEVEL=""
REPO_BRANCH=""
REPO_HEAD=""
REPO_DIRTY="unknown"
if git -C "$REPO_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  REPO_TOPLEVEL=$(git -C "$REPO_DIR" rev-parse --show-toplevel)
  REPO_BRANCH=$(git -C "$REPO_DIR" rev-parse --abbrev-ref HEAD)
  REPO_HEAD=$(git -C "$REPO_DIR" rev-parse HEAD)
  if [[ -n "$(git -C "$REPO_DIR" status --short 2>/dev/null)" ]]; then
    REPO_DIRTY="true"
  else
    REPO_DIRTY="false"
  fi
fi

declare -a sandbox_args=()
case "$SANDBOX" in
  workspace-write) sandbox_args=() ;;
  read-only) sandbox_args=(-s read-only) ;;
  danger-full-access) sandbox_args=(-s danger-full-access) ;;
  *)
    echo "Unsupported sandbox: $SANDBOX" >&2
    exit 2
    ;;
esac

cat > "$MANIFEST" <<JSON
{
  "lane": "$LANE_NAME",
  "repo": "$REPO_DIR",
  "promptFile": "$RUN_DIR/prompt.md",
  "stdoutLog": "$STDOUT_LOG",
  "finalFile": "$FINAL_FILE",
  "exitCodeFile": "$EXIT_FILE",
  "model": "gpt-5.4",
  "reasoning": "$REASONING",
  "sandbox": "$SANDBOX",
  "createdAt": "$ts",
  "launcher": "scripts/codex-lane-launch.sh",
  "promptSha256": "$PROMPT_SHA256",
  "promptBytes": $PROMPT_BYTES,
  "repoToplevel": "$REPO_TOPLEVEL",
  "repoBranch": "$REPO_BRANCH",
  "repoHead": "$REPO_HEAD",
  "repoDirty": "$REPO_DIRTY",
  "mode": "exec",
  "batchDir": "$CODEX_BATCH_DIR"
}
JSON

cmd=(
  /opt/homebrew/bin/codex exec "$PROMPT_CONTENT"
  --full-auto
  --cd "$REPO_DIR"
  --ephemeral
  --json
  -o "$FINAL_FILE"
  -c features.command_attribution=false
  -c model_reasoning_effort="$REASONING"
  -c model_reasoning_summary=concise
  -c model_auto_compact_token_limit=180000
)
if (( ${#sandbox_args[@]} )); then
  cmd+=("${sandbox_args[@]}")
fi
if (( ${#EXTRA_ARGS[@]} )); then
  cmd+=("${EXTRA_ARGS[@]}")
fi

if [[ -n "$CODEX_BATCH_DIR" && -f "$CODEX_BATCH_DIR/manifest.json" ]]; then
  python3 - "$CODEX_BATCH_DIR/manifest.json" "$RUN_DIR" <<'PY'
import json, sys
path = sys.argv[1]
run_dir = sys.argv[2]
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
lanes = data.get('laneRunDirs', [])
if run_dir not in lanes:
    lanes.append(run_dir)
    data['laneRunDirs'] = lanes
    data['updatedAt'] = __import__('datetime').datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
PY
fi

{
  echo "RUN_DIR=$RUN_DIR"
  echo "REPO_DIR=$REPO_DIR"
  echo "LANE_NAME=$LANE_NAME"
  echo "REASONING=$REASONING"
  echo "SANDBOX=$SANDBOX"
  echo "BATCH_DIR=$CODEX_BATCH_DIR"
  echo "STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "COMMAND=${cmd[*]}"
} | tee "$STDOUT_LOG"

set +e
"${cmd[@]}" 2>&1 | tee -a "$STDOUT_LOG"
status=${PIPESTATUS[0]}
set -e

printf '%s
' "$status" > "$EXIT_FILE"

python3 - "$MANIFEST" "$status" <<'PY'
import json, sys
path = sys.argv[1]
status = int(sys.argv[2])
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)
data['completedAt'] = __import__('datetime').datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
data['exitCode'] = status
with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
PY

echo "EXIT_CODE=$status" | tee -a "$STDOUT_LOG"
echo "$RUN_DIR"
exit "$status"
