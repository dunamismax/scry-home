#!/bin/zsh
set -euo pipefail

ROOT=/Users/sawyer/github
OUT=$ROOT/scry-home/reference/reviews/final-reviews
TS=$(date +%Y%m%d-%H%M%S)
RUNROOT=/Users/sawyer/.openclaw/workspace-codex-orchestrator/runs/${TS}-targeted-codex-swarm
LEDGER=$RUNROOT/ledger.tsv
mkdir -p "$OUT" "$RUNROOT"

print -r -- $'task\tpid\tmode\tworkdir\toutput_file\tlog_file\tprompt_file\tstatus' > "$LEDGER"

launch_task() {
  local task="$1"
  local mode="$2"
  local workdir="$3"
  local output_file="$4"
  local lane_dir="$RUNROOT/$task"
  local prompt_file="$lane_dir/prompt.md"
  local log_file="$lane_dir/stdout.log"
  mkdir -p "$lane_dir"

  if [[ ! -d "$workdir/.git" ]]; then
    print -r -- "$task"$'\t-\t'"$mode"$'\t'"$workdir"$'\t'"$output_file"$'\t'"$log_file"$'\t'"$prompt_file"$'\tskipped-missing-repo' >> "$LEDGER"
    return
  fi

  cat > "$prompt_file"

  rm -f "$output_file"

  script -q /dev/null zsh -lc "cd '$workdir' && codex exec $mode --ephemeral -o '$output_file' -c features.command_attribution=false -c model_reasoning_effort=high -c model_reasoning_summary=concise \"\$(cat '$prompt_file')\"" > "$log_file" 2>&1 < /dev/null &
  local pid=$!
  print -r -- "$task"$'\t'"$pid"$'\t'"$mode"$'\t'"$workdir"$'\t'"$output_file"$'\t'"$log_file"$'\t'"$prompt_file"$'\trunning' >> "$LEDGER"
}

launch_task scry-home-review --full-auto /Users/sawyer/github/scry-home /Users/sawyer/github/scry-home/reference/reviews/final-reviews/scry-home-final-review-and-renaming.md <<'EOF'
You are doing a second-pass high-context review of the `scry-home` repo.

Important context from Stephen:
- `scry-home` is his most important repo.
- It is effectively the home for his Scry AI + OpenClaw identity, ops, automation, mirrors, and supporting materials.
- It was previously named `grimoire`.
- He cares a lot about whether the current name, structure, and boundaries are actually right.

Working set:
- Primary repo: `/Users/sawyer/github/scry-home`
- Also inspect nearby OpenClaw/config context as needed, including local OpenClaw docs/config/workspace files if they materially help you understand what `scry-home` is for.
- Output report: `/Users/sawyer/github/scry-home/reference/reviews/final-reviews/scry-home-final-review-and-renaming.md`

Tasks:
1. Re-review the repo with the above purpose in mind.
2. Inspect the repo structure, automation, docs, backup flows, and Scry/OpenClaw relationship.
3. Read relevant OpenClaw config/files around the local environment as needed to ground the review.
4. Produce a deeper judgment about what the repo really is, what should live there, what should not, and how it should evolve.
5. Generate strong replacement names only if the current name still seems wrong; otherwise say so clearly.
6. Do not rename directories or remotes.
7. Do not commit.

Report requirements:
- what the repo actually is
- what should remain inside it
- what should be split/moved elsewhere
- architecture/ops review
- rename candidates, ranked if needed
- your recommended final direction
- immediate next steps
EOF

launch_task pyforge-review --full-auto /Users/sawyer/github/pyforge /Users/sawyer/github/scry-home/reference/reviews/final-reviews/pyforge-second-pass-review.md <<'EOF'
You are doing a second-pass high-context review of the `pyforge` repo.

Important context from Stephen:
- He wants this to be his main Python repo for scripts, utilities, automation, and reusable Python work.
- It was previously named `scripts`.
- He cares about scope creep, structure, and whether the current name is strong enough.

Tasks:
1. Re-review `/Users/sawyer/github/pyforge` with that context in mind.
2. Judge whether it should remain the main Python repo, and if so what its scope should be.
3. Suggest better names only if they are genuinely stronger than `pyforge`.
4. Identify what should stay narrow vs what could be absorbed.
5. Do not rename directories or remotes.
6. Do not commit.

Output report: `/Users/sawyer/github/scry-home/reference/reviews/final-reviews/pyforge-second-pass-review.md`

Report requirements:
- what the repo is now
- what it should become
- rename candidates, ranked if needed
- what other work/repo types could belong here
- risks of making it too broad
- recommended final direction
EOF

launch_task scryfall-discord-bot-review --full-auto /Users/sawyer/github/scryfall-discord-bot /Users/sawyer/github/scry-home/reference/reviews/final-reviews/scryfall-discord-bot-review.md <<'EOF'
You are doing a rename-oriented second-pass review of the `scryfall-discord-bot` repo.

Important context from Stephen:
- This repo was previously named `oracle`.
- The current direction is already `scryfall-discord-bot`.
- He wants a grounded judgment about whether that rename direction was correct and whether the repo boundary still makes sense.

Tasks:
1. Inspect `/Users/sawyer/github/scryfall-discord-bot`.
2. Check local git history and repo files to determine prior naming/identity if useful.
3. Re-review the repo with the current naming direction in mind.
4. Recommend a better final name only if one clearly beats `scryfall-discord-bot`.
5. Do not rename the repo directory or remotes.
6. Do not commit.

Output report: `/Users/sawyer/github/scry-home/reference/reviews/final-reviews/scryfall-discord-bot-review.md`

Report requirements:
- previous/older naming evidence found
- what the repo actually is
- whether `scryfall-discord-bot` is the right final name
- any better variants if they exist
- internal rename checklist for docs/package/module naming if still needed
- immediate next steps
EOF

launch_task imaging-services-ops-review --full-auto /Users/sawyer/github/imaging-services-ops /Users/sawyer/github/scry-home/reference/reviews/final-reviews/imaging-services-ops-review.md <<'EOF'
You are doing a second-pass structure review of the `imaging-services-ops` repo.

Important context from Stephen:
- This repo is now the main/only repo he wants for company/job material in this lane.
- It was previously tied to older naming like `imagingservices` and `imaging-services-website`.
- He wants a grounded judgment about whether the current consolidation and naming direction make sense.

Tasks:
1. Inspect `/Users/sawyer/github/imaging-services-ops`.
2. Re-review the repo with its current consolidated purpose in mind.
3. Judge whether the structure is now coherent for company/job material.
4. Recommend cleaner internal boundaries if they are still muddy.
5. Do not rename directories or remotes.
6. Do not commit.

Output report: `/Users/sawyer/github/scry-home/reference/reviews/final-reviews/imaging-services-ops-review.md`

Report requirements:
- what the repo is now
- whether the current consolidation is coherent
- what should remain inside it
- what should be split or archived
- naming/structure judgment
- immediate next steps
EOF

print -r -- "$RUNROOT" > /Users/sawyer/.openclaw/workspace-codex-orchestrator/runs/latest-targeted-codex-swarm.txt
print -r -- "Launched 4 targeted Codex sessions."
print -r -- "Run root: $RUNROOT"
print -r -- "Ledger: $LEDGER"
