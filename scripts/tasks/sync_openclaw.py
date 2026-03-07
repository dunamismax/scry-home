"""One-directional sync: OpenClaw workspace → this repo.

The OpenClaw workspace is canonical for identity and memory.
Specialist workspaces are mirrored for doc/back-up coverage.

Sync map:
  ~/.openclaw/workspace/SOUL.md            → <repo>/SOUL.md
  ~/.openclaw/workspace/AGENTS.md          → <repo>/AGENTS.md
  ~/.openclaw/workspace/*.md               → <repo>/openclaw/*.md
  ~/.openclaw/workspace/memory/**/*.md     → <repo>/openclaw/memory/
  ~/.openclaw/workspace/docs/**/*.md       → <repo>/openclaw/docs/
  ~/.openclaw/workspace/prompts/**/*.md    → <repo>/openclaw/prompts/
  ~/.openclaw/workspace-*/**/*.md          → <repo>/openclaw/specialists/<agentId>/
  ~/.openclaw/workspace-*/scripts/         → <repo>/openclaw/specialists/<agentId>/scripts/
  ~/.openclaw/workspace-*/templates/       → <repo>/openclaw/specialists/<agentId>/templates/
  ~/.openclaw/workspace-*/hooks/           → <repo>/openclaw/specialists/<agentId>/hooks/
  ~/.openclaw/cron/jobs.json               → <repo>/openclaw/cron-jobs.json
  ~/.openclaw/exec-approvals.json          → <repo>/openclaw/exec-approvals.json

Secrets (openclaw.json, credentials/, tokens) are NOT synced here.

Usage:
  uv run python -m scripts sync:openclaw               # sync only
  uv run python -m scripts sync:openclaw --commit      # sync + git commit + push
"""

from __future__ import annotations

import shutil
import sys
from datetime import UTC, datetime
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
MAIN_MARKDOWN_DIRS = ["memory", "docs", "prompts", "templates"]
SPECIALIST_EXCLUDE = {"main", "claude", "codex"}
SPECIALIST_MARKDOWN_DIRS = ["memory", "docs", "prompts"]
SPECIALIST_DIRS = ["scripts", "templates", "hooks"]
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


def _sync_markdown_dir(src_dir: Path, dest_dir: Path, result: SyncResult) -> None:
    if not src_dir.exists():
        return

    ensure_dir(dest_dir)

    src_files = {f.name for f in src_dir.iterdir() if f.is_file() and f.suffix == ".md"}
    dest_files = (
        {f.name for f in dest_dir.iterdir() if f.is_file() and f.suffix == ".md"}
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


def _sync_root_markdown_files(
    src_dir: Path,
    dest_dir: Path,
    result: SyncResult,
    *,
    exclude: set[str] | None = None,
) -> None:
    ensure_dir(dest_dir)
    exclude = exclude or set()

    src_files = {
        f.name
        for f in src_dir.iterdir()
        if f.is_file() and f.suffix == ".md" and f.name not in exclude
    }
    dest_files = {
        f.name
        for f in dest_dir.iterdir()
        if f.is_file() and f.suffix == ".md" and f.name not in exclude
    }

    for file in sorted(src_files):
        _sync_file(src_dir / file, dest_dir / file, result)

    for file in sorted(dest_files - src_files):
        dest_path = dest_dir / file
        try:
            dest_path.unlink()
            print(f"  [DELETE] {dest_path}")
            result.deleted += 1
        except Exception as exc:
            print(f"  [ERROR] delete {dest_path}: {exc}", file=sys.stderr)
            result.errors.append(str(exc))


def _sync_markdown_tree(src_dir: Path, dest_dir: Path, result: SyncResult) -> None:
    if not src_dir.exists():
        return

    ensure_dir(dest_dir)

    src_files = {
        p.relative_to(src_dir)
        for p in src_dir.rglob("*.md")
        if p.is_file()
    }
    dest_files = {
        p.relative_to(dest_dir)
        for p in dest_dir.rglob("*.md")
        if p.is_file()
    } if dest_dir.exists() else set()

    for rel in sorted(src_files):
        _sync_file(src_dir / rel, dest_dir / rel, result)

    for rel in sorted(dest_files - src_files, reverse=True):
        dest = dest_dir / rel
        try:
            dest.unlink()
            print(f"  [DELETE] {dest}")
            result.deleted += 1
        except Exception as exc:
            print(f"  [ERROR] delete {dest}: {exc}", file=sys.stderr)
            result.errors.append(str(exc))

    for path in sorted(dest_dir.rglob("*"), reverse=True):
        if path.is_dir():
            try:
                next(path.iterdir())
            except StopIteration:
                path.rmdir()


def _sync_tree(src_dir: Path, dest_dir: Path, result: SyncResult) -> None:
    if not src_dir.exists():
        return

    ensure_dir(dest_dir)

    src_entries = {p.relative_to(src_dir) for p in src_dir.rglob("*")}
    dest_entries = {p.relative_to(dest_dir) for p in dest_dir.rglob("*")} if dest_dir.exists() else set()

    for rel in sorted(src_entries):
        src = src_dir / rel
        dest = dest_dir / rel
        if src.is_dir():
            ensure_dir(dest)
            continue
        _sync_file(src, dest, result)

    for rel in sorted(dest_entries, reverse=True):
        if rel in src_entries:
            continue
        dest = dest_dir / rel
        try:
            if dest.is_dir():
                shutil.rmtree(dest)
            else:
                dest.unlink()
            print(f"  [DELETE] {dest}")
            result.deleted += 1
        except Exception as exc:
            print(f"  [ERROR] delete {dest}: {exc}", file=sys.stderr)
            result.errors.append(str(exc))


def _iter_specialist_ids() -> list[str]:
    if not OPENCLAW_ROOT.exists():
        return []
    return sorted(
        d.name.removeprefix("workspace-")
        for d in OPENCLAW_ROOT.iterdir()
        if d.is_dir()
        and d.name.startswith("workspace-")
        and d.name.removeprefix("workspace-") not in SPECIALIST_EXCLUDE
    )


def _sync_specialists(result: SyncResult) -> None:
    dest_root = REPO_ROOT / "openclaw" / "specialists"
    ensure_dir(dest_root)

    specialist_ids = _iter_specialist_ids()
    seen = set(specialist_ids)

    for agent_id in specialist_ids:
        src_ws = OPENCLAW_ROOT / f"workspace-{agent_id}"
        dest_ws = dest_root / agent_id
        ensure_dir(dest_ws)

        _sync_root_markdown_files(src_ws, dest_ws, result)

        for dirname in SPECIALIST_MARKDOWN_DIRS:
            src_dir = src_ws / dirname
            dest_dir = dest_ws / dirname
            if src_dir.exists():
                _sync_markdown_tree(src_dir, dest_dir, result)
            elif dest_dir.exists():
                try:
                    shutil.rmtree(dest_dir)
                    print(f"  [DELETE] {dest_dir}")
                    result.deleted += 1
                except Exception as exc:
                    print(f"  [ERROR] delete {dest_dir}: {exc}", file=sys.stderr)
                    result.errors.append(str(exc))

        for dirname in SPECIALIST_DIRS:
            src_dir = src_ws / dirname
            dest_dir = dest_ws / dirname
            if src_dir.exists():
                _sync_tree(src_dir, dest_dir, result)
            elif dest_dir.exists():
                try:
                    shutil.rmtree(dest_dir)
                    print(f"  [DELETE] {dest_dir}")
                    result.deleted += 1
                except Exception as exc:
                    print(f"  [ERROR] delete {dest_dir}: {exc}", file=sys.stderr)
                    result.errors.append(str(exc))

    existing_dirs = {d.name for d in dest_root.iterdir() if d.is_dir()} if dest_root.exists() else set()
    for agent_id in existing_dirs - seen:
        stale = dest_root / agent_id
        try:
            shutil.rmtree(stale)
            print(f"  [DELETE] {stale}")
            result.deleted += 1
        except Exception as exc:
            print(f"  [ERROR] delete {stale}: {exc}", file=sys.stderr)
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

    log_step("Workspace markdown → openclaw/")
    _sync_root_markdown_files(OPENCLAW_WORKSPACE, REPO_ROOT / "openclaw", result)

    log_step("Workspace markdown dirs → openclaw/")
    for dirname in MAIN_MARKDOWN_DIRS:
        src_dir = OPENCLAW_WORKSPACE / dirname
        dest_dir = REPO_ROOT / "openclaw" / dirname
        if src_dir.exists():
            _sync_markdown_tree(src_dir, dest_dir, result)
        elif dest_dir.exists():
            shutil.rmtree(dest_dir)
            print(f"  [DELETE] {dest_dir}")
            result.deleted += 1

    log_step("OpenClaw config files → openclaw/")
    for src, dest in EXTRA_FILES:
        _sync_file(OPENCLAW_ROOT / src, REPO_ROOT / "openclaw" / dest, result)

    log_step("Specialist workspace mirrors → openclaw/specialists/")
    _sync_specialists(result)

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
    date = datetime.now(UTC).strftime("%Y-%m-%d")

    # Only stage the files we actually synced — never `git add -A` which
    # could sweep in unrelated local edits.
    sync_paths = [
        *(str(REPO_ROOT / f) for f in ROOT_FILES),
        str(REPO_ROOT / "openclaw"),
        *(str(REPO_ROOT / "openclaw" / dest) for _, dest in EXTRA_FILES),
        str(REPO_ROOT / "openclaw" / "specialists"),
    ]
    run_or_throw(["git", "add", "--", *sync_paths], cwd=str(REPO_ROOT))

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


if __name__ == "__main__":
    sync_openclaw()
