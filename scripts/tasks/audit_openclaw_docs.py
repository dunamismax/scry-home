"""Audit OpenClaw workspace docs, mirrors, and path references for drift.

Checks:
- required canonical main-workspace markdown files exist
- repo-root SOUL/AGENTS match canonical workspace copies
- local `openclaw/` mirror matches all canonical main-workspace `.md` files
- specialist mirrors match all canonical specialist-workspace `.md` files
- local filesystem paths referenced in markdown actually exist (best-effort, low-noise)

Usage:
  uv run python -m scripts openclaw:audit
"""

from __future__ import annotations

import re
from pathlib import Path

from scripts.common import log_step

REPO_ROOT = Path(__file__).resolve().parents[2]
OPENCLAW_ROOT = Path.home() / ".openclaw"
MAIN_WS = OPENCLAW_ROOT / "workspace"
MIRROR_ROOT = REPO_ROOT / "openclaw"
SPECIALIST_MIRROR_ROOT = MIRROR_ROOT / "specialists"
SPECIALIST_EXCLUDE = {"main", "claude", "codex"}
REQUIRED_MAIN_DOCS = {
    "SOUL.md",
    "AGENTS.md",
    "IDENTITY.md",
    "USER.md",
    "MEMORY.md",
    "TOOLS.md",
    "HEARTBEAT.md",
    "BOOTSTRAP.md",
}
PATH_RE = re.compile(r"(?P<path>~(?:/[A-Za-z0-9._-]+)+|/(?:Users|opt|Applications|Library|private|tmp)(?:/[A-Za-z0-9._~/-]+)+)")
TRAILING_PATH_PUNCT = ".,;:!?)>]}'\"`"
SKIP_PATH_FRAGMENTS = (
    "<repo>",
    "<agentId>",
    "<timestamp>",
    "<lane>",
    "<INITIAL_PROMPT>",
    "<PROMPT>",
)
COMMON_GIT_REF_NAMES = {"main", "master", "develop", "dev", "HEAD"}
IGNORED_TOP_LEVEL_DIRS = {"reviews", "runs"}
MAIN_MARKDOWN_DIRS = {"memory", "docs", "prompts", "templates"}
PATH_SCAN_IGNORED_TOP_LEVEL_DIRS = {"memory", "reviews", "runs"}


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _workspace_markdown_files(root: Path) -> set[Path]:
    if not root.exists():
        return set()
    files: set[Path] = set()
    for p in root.rglob("*.md"):
        if not p.is_file():
            continue
        rel = p.relative_to(root)
        if rel.parts and rel.parts[0] in IGNORED_TOP_LEVEL_DIRS:
            continue
        files.add(rel)
    return files


def _main_mirror_markdown_files(root: Path) -> set[Path]:
    if not root.exists():
        return set()
    files: set[Path] = set()
    for p in root.rglob("*.md"):
        if not p.is_file():
            continue
        rel = p.relative_to(root)
        if rel.parts and rel.parts[0] in IGNORED_TOP_LEVEL_DIRS:
            continue
        if len(rel.parts) == 1:
            files.add(rel)
            continue
        if rel.parts[0] in MAIN_MARKDOWN_DIRS:
            files.add(rel)
    return files


def _files_match(a: Path, b: Path) -> bool:
    return a.exists() and b.exists() and a.read_bytes() == b.read_bytes()


def _specialist_ids() -> list[str]:
    if not OPENCLAW_ROOT.exists():
        return []
    return sorted(
        p.name.removeprefix("workspace-")
        for p in OPENCLAW_ROOT.iterdir()
        if p.is_dir()
        and p.name.startswith("workspace-")
        and p.name.removeprefix("workspace-") not in SPECIALIST_EXCLUDE
    )


def _expand_path(token: str) -> Path:
    return Path(token).expanduser()


def _referenced_local_paths(md_path: Path) -> set[str]:
    text = _read(md_path)
    found: set[str] = set()
    for match in PATH_RE.finditer(text):
        token = match.group("path").rstrip(TRAILING_PATH_PUNCT + " \t")
        if any(fragment in token for fragment in SKIP_PATH_FRAGMENTS):
            continue
        found.add(token)
    return found


def _is_example_path(token: str) -> bool:
    path = _expand_path(token)

    # Temp-worktree prefixes like /tmp/openclaw-fix-<topic>
    if str(path).startswith("/tmp/") and path.name.endswith("-"):
        return True

    # Repo/branch shorthand like ~/github/openclaw/main where the parent is the repo.
    if path.name in COMMON_GIT_REF_NAMES:
        parent = path.parent
        if parent.exists() and (parent / ".git").exists():
            return True

    return False


def _path_exists(token: str) -> bool:
    path = _expand_path(token)
    return path.exists() or _is_example_path(token)


def audit_openclaw_docs() -> None:
    issues: list[str] = []
    warnings: list[str] = []

    log_step("Checking canonical workspace presence")
    if not MAIN_WS.exists():
        raise RuntimeError(f"Main workspace missing: {MAIN_WS}")

    main_top_level = {
        p.name for p in MAIN_WS.iterdir() if p.is_file() and p.suffix == ".md"
    }
    missing_main = sorted(REQUIRED_MAIN_DOCS - main_top_level)
    for name in missing_main:
        issues.append(f"missing-main-doc:{name}")

    log_step("Checking root canonical mirrors")
    for name in ("SOUL.md", "AGENTS.md"):
        src = MAIN_WS / name
        dest = REPO_ROOT / name
        if not _files_match(src, dest):
            issues.append(f"root-drift:{name}")

    log_step("Checking main workspace markdown mirror")
    main_src_files = _main_mirror_markdown_files(MAIN_WS)
    main_dest_files = _main_mirror_markdown_files(MIRROR_ROOT)

    for rel in sorted(main_src_files - main_dest_files):
        issues.append(f"mirror-missing:openclaw/{rel.as_posix()}")
    for rel in sorted(main_dest_files - main_src_files):
        issues.append(f"mirror-stale:openclaw/{rel.as_posix()}")
    for rel in sorted(main_src_files & main_dest_files):
        if not _files_match(MAIN_WS / rel, MIRROR_ROOT / rel):
            issues.append(f"mirror-drift:openclaw/{rel.as_posix()}")

    log_step("Checking specialist workspace markdown mirrors")
    specialist_ids = _specialist_ids()
    seen = set(specialist_ids)
    for agent_id in specialist_ids:
        src_root = OPENCLAW_ROOT / f"workspace-{agent_id}"
        dest_root = SPECIALIST_MIRROR_ROOT / agent_id
        src_files = _workspace_markdown_files(src_root)
        dest_files = _workspace_markdown_files(dest_root)

        for rel in sorted(src_files - dest_files):
            issues.append(f"specialist-mirror-missing:{agent_id}:{rel.as_posix()}")
        for rel in sorted(dest_files - src_files):
            issues.append(f"specialist-mirror-stale:{agent_id}:{rel.as_posix()}")
        for rel in sorted(src_files & dest_files):
            if not _files_match(src_root / rel, dest_root / rel):
                issues.append(f"specialist-mirror-drift:{agent_id}:{rel.as_posix()}")

    if SPECIALIST_MIRROR_ROOT.exists():
        for path in sorted(p for p in SPECIALIST_MIRROR_ROOT.iterdir() if p.is_dir()):
            if path.name not in seen:
                issues.append(f"specialist-mirror-orphan:{path.name}")

    log_step("Checking markdown path references")
    source_markdown_roots = [MAIN_WS, *(OPENCLAW_ROOT / f"workspace-{aid}" for aid in specialist_ids)]
    checked_refs = 0
    for root in source_markdown_roots:
        for rel in sorted(_workspace_markdown_files(root)):
            if rel.parts and rel.parts[0] in PATH_SCAN_IGNORED_TOP_LEVEL_DIRS:
                continue
            file_path = root / rel
            for token in sorted(_referenced_local_paths(file_path)):
                checked_refs += 1
                if not _path_exists(token):
                    issues.append(f"stale-path:{file_path}:{token}")

    print(f"checked main markdown files: {len(main_src_files)}")
    print(f"checked specialists: {len(specialist_ids)}")
    print(f"checked local path references: {checked_refs}")

    if warnings:
        print("\nWarnings:")
        for item in warnings:
            print(f"- {item}")

    if issues:
        print("\nFAIL: workspace doc audit found issues")
        for item in issues:
            print(f"- {item}")
        raise SystemExit(1)

    print("\nOK: workspace docs, mirrors, and path references are consistent")


if __name__ == "__main__":
    audit_openclaw_docs()
