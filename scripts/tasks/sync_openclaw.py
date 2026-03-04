"""One-directional sync: OpenClaw workspace → this repo.

The OpenClaw workspace is canonical for identity and memory.

Sync map:
  ~/.openclaw/workspace/SOUL.md      → <repo>/SOUL.md
  ~/.openclaw/workspace/AGENTS.md    → <repo>/AGENTS.md
  ~/.openclaw/workspace/SOUL.md      → <repo>/openclaw/SOUL.md
  ~/.openclaw/workspace/AGENTS.md    → <repo>/openclaw/AGENTS.md
  ~/.openclaw/workspace/TOOLS.md     → <repo>/openclaw/TOOLS.md
  ~/.openclaw/workspace/HEARTBEAT.md → <repo>/openclaw/HEARTBEAT.md
  ~/.openclaw/workspace/memory/      → <repo>/openclaw/memory/
  ~/.openclaw/cron/jobs.json         → <repo>/openclaw/cron-jobs.json
  ~/.openclaw/exec-approvals.json    → <repo>/openclaw/exec-approvals.json

Secrets (openclaw.json, credentials/, tokens) are NOT synced here.

Usage:
  python3 -m scripts sync:openclaw               # sync only
  python3 -m scripts sync:openclaw --commit       # sync + git commit + push
"""

from __future__ import annotations

import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

from scripts.common import ensure_dir, log_step, run_or_throw

OPENCLAW_WORKSPACE = Path(
    __import__("os").environ.get(
        "OPENCLAW_WORKSPACE", Path.home() / ".openclaw" / "workspace"
    )
)
OPENCLAW_ROOT = Path(
    __import__("os").environ.get("OPENCLAW_ROOT", Path.home() / ".openclaw")
)
REPO_ROOT = Path.cwd().resolve()

ROOT_FILES = ["SOUL.md", "AGENTS.md"]
OPENCLAW_FILES = ["SOUL.md", "AGENTS.md", "MEMORY.md", "TOOLS.md", "HEARTBEAT.md"]
EXTRA_FILES = [
    ("cron/jobs.json", "cron-jobs.json"),
    ("exec-approvals.json", "exec-approvals.json"),
]


class SyncResult:
    def __init__(self) -> None:
        self.copied = 0
        self.skipped = 0
        self.deleted = 0
        self.errors: list[str] = []


def _files_match(a: Path, b: Path) -> bool:
    if not a.exists() or not b.exists():
        return False
    if a.stat().st_size != b.stat().st_size:
        return False
    return a.read_bytes() == b.read_bytes()


def _sync_file(src: Path, dest: Path, result: SyncResult) -> None:
    if not src.exists():
        return

    if _files_match(src, dest):
        result.skipped += 1
        return

    try:
        ensure_dir(dest.parent)
        shutil.copy2(str(src), str(dest))
        print(f"  [COPY] {src} → {dest}")
        result.copied += 1
    except Exception as exc:
        print(f"  [ERROR] {src}: {exc}", file=sys.stderr)
        result.errors.append(str(exc))


def _sync_memory(result: SyncResult) -> None:
    src_dir = OPENCLAW_WORKSPACE / "memory"
    dest_dir = REPO_ROOT / "openclaw" / "memory"

    if not src_dir.exists():
        print("  [SKIP] no memory directory in workspace")
        return

    ensure_dir(dest_dir)

    src_files = {f.name for f in src_dir.iterdir() if f.suffix == ".md"}
    dest_files = (
        {f.name for f in dest_dir.iterdir() if f.suffix == ".md"}
        if dest_dir.exists()
        else set()
    )

    for file in src_files:
        _sync_file(src_dir / file, dest_dir / file, result)

    for file in dest_files:
        if file not in src_files:
            dest_path = dest_dir / file
            try:
                dest_path.unlink()
                print(f"  [DELETE] {dest_path}")
                result.deleted += 1
            except Exception as exc:
                print(f"  [ERROR] delete {dest_path}: {exc}", file=sys.stderr)
                result.errors.append(str(exc))


def sync_openclaw() -> None:
    commit = "--commit" in sys.argv

    log_step("Syncing OpenClaw workspace → repo")
    print(f"  workspace: {OPENCLAW_WORKSPACE}")
    print(f"  repo:      {REPO_ROOT}")

    if not OPENCLAW_WORKSPACE.exists():
        raise RuntimeError(f"OpenClaw workspace not found: {OPENCLAW_WORKSPACE}")

    result = SyncResult()

    log_step("Identity docs → repo root")
    for file in ROOT_FILES:
        _sync_file(OPENCLAW_WORKSPACE / file, REPO_ROOT / file, result)

    log_step("Workspace files → openclaw/")
    for file in OPENCLAW_FILES:
        _sync_file(OPENCLAW_WORKSPACE / file, REPO_ROOT / "openclaw" / file, result)

    log_step("OpenClaw config files → openclaw/")
    for src, dest in EXTRA_FILES:
        _sync_file(OPENCLAW_ROOT / src, REPO_ROOT / "openclaw" / dest, result)

    log_step("Memory → openclaw/memory/")
    _sync_memory(result)

    log_step("Sync complete")
    print(f"  copied: {result.copied}")
    print(f"  skipped: {result.skipped} (unchanged)")
    print(f"  deleted: {result.deleted}")
    if result.errors:
        print(f"  errors: {len(result.errors)}")

    if not commit:
        if result.copied > 0 or result.deleted > 0:
            print("\n  pass --commit to auto-commit and push")
        return

    if result.copied == 0 and result.deleted == 0:
        print("\n  nothing changed; skipping commit")
        return

    log_step("Committing and pushing")
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    run_or_throw(["git", "add", "-A"], cwd=str(REPO_ROOT))

    try:
        run_or_throw(
            ["git", "commit", "-m", f"sync openclaw workspace {date}"],
            cwd=str(REPO_ROOT),
        )
    except RuntimeError as exc:
        if "nothing to commit" in str(exc):
            print("  nothing to commit (git tree clean)")
            return
        raise

    run_or_throw(["git", "push", "origin", "main"], cwd=str(REPO_ROOT))
    print("  committed and pushed")
