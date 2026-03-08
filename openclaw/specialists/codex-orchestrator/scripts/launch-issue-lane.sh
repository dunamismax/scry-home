#!/usr/bin/env bash
set -euo pipefail

LANE_NAME="${1:-}"
REPO_DIR="${2:-}"
ISSUE_RAW="${3:-}"
PROMPT_FILE="${4:-}"
REASONING="${5:-high}"
SANDBOX="${6:-workspace-write}"
BASE_REF="${7:-origin/main}"

if [[ -z "$LANE_NAME" || -z "$REPO_DIR" || -z "$ISSUE_RAW" || -z "$PROMPT_FILE" ]]; then
  echo "Usage: $0 <lane-name> <repo-dir> <issue-id> <prompt-file> [reasoning] [sandbox] [base-ref]" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PREP_OUTPUT="$($SCRIPT_DIR/prepare-issue-worktree.sh "$REPO_DIR" "$ISSUE_RAW" "$BASE_REF")"
eval "$PREP_OUTPUT"

>&2 echo "$PREP_OUTPUT"
exec "$SCRIPT_DIR/codex-lane-launch.sh" "$LANE_NAME" "$WORKTREE_DIR" "$PROMPT_FILE" "$REASONING" "$SANDBOX"
