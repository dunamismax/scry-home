from __future__ import annotations

import os
import sys
from pathlib import Path

from scripts.lib import command_exists, log_step, run_or_throw

_home = os.environ.get("HOME", "/home/sawyer")
SCRIPT_REPO_ROOT = Path(__file__).resolve().parent.parent
GITHUB_ROOT = Path(os.environ.get("GITHUB_ROOT", str(Path(_home, "github"))))
OWNER = os.environ.get("GITHUB_OWNER", "dunamismax")
ANCHOR_REPO = os.environ.get("GITHUB_ANCHOR_REPO", "scryai")
PROFILE_REPO = os.environ.get("GITHUB_PROFILE_REPO", "dunamismax")
MANAGED_PROJECT_REPOS: list[str] = []  # Add new managed repos here as they are created.
REPOS_INDEX_PATH = GITHUB_ROOT / PROFILE_REPO / "REPOS.md"

LOCAL_ONLY = "--local-only" in sys.argv
USE_FALLBACK = "--use-fallback" in sys.argv

FALLBACK_REPOS = [
    "scryai",
    "dunamismax",
    "BereanAI",
    "TALLstack",
    "c-from-the-ground-up",
    "codex-web",
    "configs",
    "hello-world-from-hell",
    "images",
    "imaging-services-website",
    "imagingservices",
    "mtg-card-bot",
    "mylife-rpg",
    "poddashboard",
    "xray-chrome",
]


def _repo_dir(repo: str) -> Path:
    return GITHUB_ROOT / repo


def _github_url(repo: str) -> str:
    return f"git@github.com:{OWNER}/{repo}.git"


def _codeberg_url(repo: str) -> str:
    return f"git@codeberg.org:{OWNER}/{repo}.git"


def _unique_ordered(items: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        stripped = item.strip()
        if stripped and stripped not in seen:
            seen.add(stripped)
            ordered.append(stripped)
    return ordered


def _ensure_prereqs() -> None:
    log_step("Checking workstation bootstrap prerequisites")
    required = ["git", "ssh"]
    if "--restore-ssh" in sys.argv:
        required.append("uv")
    for tool in required:
        if not command_exists(tool):
            raise RuntimeError(f"Missing required tool: {tool}")
        print(f"ok: {tool}")


def _ensure_github_root() -> None:
    log_step("Ensuring projects root")
    GITHUB_ROOT.mkdir(parents=True, exist_ok=True)
    print(f"root: {GITHUB_ROOT}")


def _maybe_restore_ssh_backup() -> None:
    if "--restore-ssh" not in sys.argv:
        return
    log_step("Restoring encrypted SSH backup")
    run_or_throw(["uv", "run", "scry-setup-ssh-restore"], cwd=str(SCRIPT_REPO_ROOT))


def _clone_or_fetch(repo: str) -> None:
    target = _repo_dir(repo)
    if not target.exists():
        if LOCAL_ONLY:
            raise RuntimeError(f"Repository missing in local-only mode: {target}")
        log_step(f"Cloning {repo}")
        run_or_throw(["git", "clone", _github_url(repo), str(target)])
        return
    if not (target / ".git").is_dir():
        raise RuntimeError(f"Path exists but is not a git repository: {target}")
    if LOCAL_ONLY:
        log_step(f"Using local repository {repo}")
        return
    log_step(f"Fetching {repo}")
    run_or_throw(["git", "-C", str(target), "fetch", "--all", "--prune"])


def _remote_exists(target_dir: Path, remote: str) -> bool:
    remotes = run_or_throw(["git", "-C", str(target_dir), "remote"], quiet=True)
    return remote in [line.strip() for line in remotes.splitlines() if line.strip()]


def _ensure_dual_push_urls(repo: str) -> None:
    target = _repo_dir(repo)
    github = _github_url(repo)
    codeberg = _codeberg_url(repo)

    if not _remote_exists(target, "origin"):
        run_or_throw(["git", "-C", str(target), "remote", "add", "origin", github])

    run_or_throw(["git", "-C", str(target), "remote", "set-url", "origin", github])

    import subprocess

    subprocess.run(
        ["git", "-C", str(target), "config", "--unset-all", "remote.origin.pushurl"],
        capture_output=True,
    )

    run_or_throw(
        ["git", "-C", str(target), "remote", "set-url", "--add", "--push", "origin", github]
    )
    run_or_throw(
        ["git", "-C", str(target), "remote", "set-url", "--add", "--push", "origin", codeberg]
    )


def _parse_repos_from_index(markdown: str) -> list[str]:
    import re

    lines = markdown.splitlines()
    repos: list[str] = []
    in_section = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("## "):
            if stripped == "## Repositories":
                in_section = True
                continue
            if in_section:
                break
        if not in_section:
            continue
        match = re.match(r"^###\s+([A-Za-z0-9._-]+)\s*$", stripped)
        if match:
            repos.append(match.group(1))
    return _unique_ordered(repos)


def _load_repo_plan() -> tuple[list[str], list[str], str]:
    """Returns (synced_repos, discovered_repos, source)."""
    parsed: list[str] = []
    if REPOS_INDEX_PATH.exists():
        parsed = _parse_repos_from_index(REPOS_INDEX_PATH.read_text())

    if not parsed:
        if not USE_FALLBACK:
            raise RuntimeError(
                f"No repositories parsed from {REPOS_INDEX_PATH}. "
                "Re-run with --use-fallback to load the built-in discovery list."
            )
        synced = _unique_ordered([ANCHOR_REPO, PROFILE_REPO, *MANAGED_PROJECT_REPOS])
        discovered = _unique_ordered([*synced, *FALLBACK_REPOS])
        log_step("Repository set")
        print(f"warning: using fallback discovery list from {REPOS_INDEX_PATH}")
        print(
            "warning: fallback mode is discovery-only; "
            "only anchor/profile/managed repos will be cloned or remote-configured"
        )
        for repo in discovered:
            print(f"- {repo}")
        return synced, discovered, "fallback"

    synced = _unique_ordered([ANCHOR_REPO, PROFILE_REPO, *MANAGED_PROJECT_REPOS, *parsed])
    log_step("Repository set")
    for repo in synced:
        print(f"- {repo}")
    return synced, synced, "index"


def _configure_remotes(repos: list[str]) -> None:
    log_step("Enforcing dual push URL policy")
    for repo in repos:
        _ensure_dual_push_urls(repo)


def _print_remote_summary(repos: list[str]) -> None:
    log_step("Remote summary")
    for repo in repos:
        push_urls = run_or_throw(
            ["git", "-C", str(_repo_dir(repo)), "remote", "get-url", "--all", "--push", "origin"],
            quiet=True,
        )
        urls = " | ".join(line for line in push_urls.splitlines() if line)
        print(f"{repo}: {urls}")


def _print_fallback_discovery_summary(discovered: list[str], synced: list[str]) -> None:
    synced_set = set(synced)
    discovery_only = [r for r in discovered if r not in synced_set]
    if not discovery_only:
        return
    log_step("Fallback discovery-only repositories")
    for repo in discovery_only:
        target = _repo_dir(repo)
        present = target.is_dir() and (target / ".git").is_dir()
        print(f"{repo}: {'present' if present else 'missing'} ({target})")


def main() -> None:
    _ensure_prereqs()
    _ensure_github_root()

    _clone_or_fetch(ANCHOR_REPO)
    anchor_canonical = _repo_dir(ANCHOR_REPO).resolve()
    if SCRIPT_REPO_ROOT.resolve() != anchor_canonical:
        print(f"note: running from {SCRIPT_REPO_ROOT}")
        print(f"note: canonical anchor is {anchor_canonical}")

    _maybe_restore_ssh_backup()
    _clone_or_fetch(PROFILE_REPO)

    synced, discovered, source = _load_repo_plan()
    for repo in synced:
        if repo in (ANCHOR_REPO, PROFILE_REPO):
            continue
        _clone_or_fetch(repo)

    _configure_remotes(synced)
    _print_remote_summary(synced)
    if source == "fallback":
        _print_fallback_discovery_summary(discovered, synced)

    log_step("Workstation bootstrap complete")
    if LOCAL_ONLY:
        print("mode: local-only")
    if source == "fallback":
        print("mode: fallback-discovery-only")
    print("next: uv run scry-bootstrap")


if __name__ == "__main__":
    main()
