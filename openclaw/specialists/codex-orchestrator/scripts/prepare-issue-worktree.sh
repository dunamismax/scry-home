#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-}"
ISSUE_RAW="${2:-}"
BASE_REF="${3:-origin/main}"
BRANCH_PREFIX="${4:-codex/issue}"
WORKTREE_ROOT="${CODEX_WORKTREE_ROOT:-/Users/sawyer/.openclaw/worktrees}"
HOOKS_PATH="/Users/sawyer/.openclaw/workspace-codex-orchestrator/hooks/git"

if [[ -z "$REPO_DIR" || -z "$ISSUE_RAW" ]]; then
  echo "Usage: $0 <repo-dir> <issue-id> [base-ref] [branch-prefix]" >&2
  exit 2
fi

if [[ ! -d "$REPO_DIR" ]]; then
  echo "Repo dir not found: $REPO_DIR" >&2
  exit 2
fi

if ! git -C "$REPO_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Not a git repo: $REPO_DIR" >&2
  exit 2
fi

REPO_TOPLEVEL="$(git -C "$REPO_DIR" rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_TOPLEVEL")"
ISSUE_ID="$(printf '%s' "$ISSUE_RAW" | tr -cd '0-9')"
if [[ -z "$ISSUE_ID" ]]; then
  echo "Issue id must contain digits: $ISSUE_RAW" >&2
  exit 2
fi

if [[ "$REPO_TOPLEVEL" == "/Users/sawyer/openclaw" ]]; then
  echo "Refusing to create issue worktree from live runtime checkout: /Users/sawyer/openclaw" >&2
  echo "Use the contribution clone instead (expected: /Users/sawyer/github/openclaw)." >&2
  exit 2
fi

SAFE_REPO_NAME="$(printf '%s' "$REPO_NAME" | sed -E 's/[^A-Za-z0-9._-]+/-/g')"
BRANCH_NAME="${BRANCH_PREFIX}-${ISSUE_ID}"
WORKTREE_DIR="$WORKTREE_ROOT/$SAFE_REPO_NAME/$SAFE_REPO_NAME-issue-$ISSUE_ID"
mkdir -p "$(dirname "$WORKTREE_DIR")"

existing_path="$(git -C "$REPO_TOPLEVEL" worktree list --porcelain | awk '/^worktree /{print $2}' | awk -v b="$WORKTREE_DIR" '$0==b{print $0}')"
if [[ -n "$existing_path" && -d "$WORKTREE_DIR" ]]; then
  git -C "$WORKTREE_DIR" config core.hooksPath "$HOOKS_PATH"
  echo "WORKTREE_DIR=$WORKTREE_DIR"
  echo "REPO_TOPLEVEL=$REPO_TOPLEVEL"
  echo "BRANCH_NAME=$(git -C "$WORKTREE_DIR" rev-parse --abbrev-ref HEAD)"
  echo "BASE_REF=$BASE_REF"
  echo "STATUS=reused"
  exit 0
fi

if [[ -e "$WORKTREE_DIR" ]]; then
  echo "Target worktree path already exists and is not a known git worktree: $WORKTREE_DIR" >&2
  exit 2
fi

if git -C "$REPO_TOPLEVEL" show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  git -C "$REPO_TOPLEVEL" worktree add "$WORKTREE_DIR" "$BRANCH_NAME" >/dev/null
else
  git -C "$REPO_TOPLEVEL" worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$BASE_REF" >/dev/null
fi

git -C "$WORKTREE_DIR" config core.hooksPath "$HOOKS_PATH"

cat <<EOF
WORKTREE_DIR=$WORKTREE_DIR
REPO_TOPLEVEL=$REPO_TOPLEVEL
BRANCH_NAME=$BRANCH_NAME
BASE_REF=$BASE_REF
STATUS=created
EOF
