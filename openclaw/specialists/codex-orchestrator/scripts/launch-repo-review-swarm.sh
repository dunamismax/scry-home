#!/bin/zsh
set -euo pipefail

ROOT=/Users/sawyer/github
OUT=$ROOT/scry-home/reference/reviews/repo-review-swarm
TS=$(date +%Y%m%d-%H%M%S)
RUNROOT=/Users/sawyer/.openclaw/workspace-codex-orchestrator/runs/${TS}-repo-review-swarm
LEDGER=$RUNROOT/ledger.tsv
mkdir -p "$OUT" "$RUNROOT"

typeset -a DEFAULT_REPOS=()
for candidate in "$ROOT"/*; do
  [[ -d "$candidate" ]] || continue
  repo="${candidate:t}"
  case "$repo" in
    __pycache__|forks|worktrees)
      continue
      ;;
  esac
  [[ -d "$candidate/.git" ]] || continue
  DEFAULT_REPOS+=("$repo")
done

typeset -a REPOS
if (( $# > 0 )); then
  REPOS=("$@")
else
  REPOS=("${DEFAULT_REPOS[@]}")
fi

print -r -- $'repo\tpid\treview_file\tlog_file\tprompt_file\tstatus' > "$LEDGER"

for repo in $REPOS; do
  repo_dir="$ROOT/$repo"
  review_file="$OUT/$repo.md"
  lane_dir="$RUNROOT/$repo"
  prompt_file="$lane_dir/prompt.md"
  log_file="$lane_dir/stdout.log"
  mkdir -p "$lane_dir"

  if [[ ! -d "$repo_dir/.git" ]]; then
    print -r -- "$repo	-	$review_file	$log_file	$prompt_file	skipped-missing-repo" >> "$LEDGER"
    continue
  fi

  cat > "$prompt_file" <<EOF
You are reviewing the repository in the current working directory.

Write a Markdown review with these exact sections:
1. Repo
2. What it is
3. Current state
4. Code / architecture review
5. Keep / pivot / archive / delete recommendation
6. Why it may be worth keeping
7. Why it may be dumb / redundant / not worth continued attention
8. Rename ideas
9. Immediate next step

Instructions:
- Inspect the repo directly.
- Read local README/docs/code first.
- Be candid and blunt when warranted, but ground every judgment in evidence from the repo.
- Evaluate whether the project is useful, redundant, stale, overbuilt, vague, pointless, or worth continuing.
- Suggest cleaner, more literal, or more memorable repo/project names.
- Prefer lightweight checks only.
- Do not modify repo files.
- Output only the final Markdown review.
EOF

  if [[ -s "$review_file" ]]; then
    print -r -- "$repo	-	$review_file	$log_file	$prompt_file	skipped-existing" >> "$LEDGER"
    continue
  fi

  rm -f "$review_file"

  script -q /dev/null zsh -lc "cd '$repo_dir' && codex exec --full-auto --ephemeral -o '$review_file' -c features.command_attribution=false -c model_reasoning_effort=high -c model_reasoning_summary=concise \"\$(cat '$prompt_file')\"" > "$log_file" 2>&1 < /dev/null &
  pid=$!
  print -r -- "$repo	$pid	$review_file	$log_file	$prompt_file	running" >> "$LEDGER"
done

print -r -- "$RUNROOT" > /Users/sawyer/.openclaw/workspace-codex-orchestrator/runs/latest-repo-review-swarm.txt
print -r -- "Launched ${#REPOS[@]} repo review codex sessions."
print -r -- "Run root: $RUNROOT"
print -r -- "Ledger: $LEDGER"
