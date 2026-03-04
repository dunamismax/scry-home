"""Workstation bootstrap: clone repos, enforce dual remotes, restore SSH if needed."""

from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path

from scripts.common import (
    command_exists,
    has_env,
    is_git_repo,
    log_step,
    run_or_throw,
)
from scripts.projects_config import MANAGED_PROJECTS


def _discover_repos(root: str) -> list[str]:
    root_path = Path(root)
    if not root_path.exists():
        return []
    return [
        d.name
        for d in sorted(root_path.iterdir(), key=lambda p: p.name)
        if d.is_dir() and is_git_repo(str(d))
    ]


def _unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        s = item.strip()
        if s and s not in seen:
            seen.add(s)
            result.append(s)
    return result


def _repo_name_from_path(path: str) -> str:
    return Path(path.strip().rstrip("/")).name


def parse_repos_from_index(markdown: str) -> list[str]:
    repos: list[str] = []
    in_section = False

    for raw_line in markdown.split("\n"):
        line = raw_line.strip()

        if line.startswith("## "):
            if line == "## Repositories":
                in_section = True
                continue
            if in_section:
                break

        if not in_section:
            continue

        match = re.match(r"^###\s+([A-Za-z0-9._-]+)\s*$", line)
        if match:
            repos.append(match.group(1))

    return _unique(repos)


def setup_workstation() -> None:
    home = os.environ.get("HOME", str(Path.home()))
    script_repo_root = str(Path.cwd().resolve())
    github_root = os.environ.get("GITHUB_ROOT", str(Path(home) / "github"))
    owner = os.environ.get("GITHUB_OWNER", "dunamismax")
    github_host_alias = os.environ.get("GITHUB_HOST_ALIAS", f"github.com-{owner}")
    codeberg_host_alias = os.environ.get("CODEBERG_HOST_ALIAS", f"codeberg.org-{owner}")
    anchor_repo = os.environ.get("GITHUB_ANCHOR_REPO", "grimoire")
    profile_repo = os.environ.get("GITHUB_PROFILE_REPO", "dunamismax")
    repos_index_path = str(Path(github_root) / profile_repo / "REPOS.md")
    managed_project_repos = _unique(
        [
            _repo_name_from_path(str(p.path))
            for p in MANAGED_PROJECTS
            if _repo_name_from_path(str(p.path))
        ]
    )

    local_only = has_env("LOCAL_ONLY")
    use_fallback = has_env("USE_FALLBACK")
    restore_ssh = has_env("RESTORE_SSH")

    def repo_dir(repo: str) -> str:
        return str(Path(github_root) / repo)

    def github_url(repo: str) -> str:
        return f"git@{github_host_alias}:{owner}/{repo}.git"

    def codeberg_url(repo: str) -> str:
        return f"git@{codeberg_host_alias}:{owner}/{repo}.git"

    def clone_or_fetch(repo: str) -> None:
        target = repo_dir(repo)
        if not Path(target).exists():
            if local_only:
                raise RuntimeError(f"Repository missing in local-only mode: {target}")
            log_step(f"Cloning {repo}")
            run_or_throw(["git", "clone", github_url(repo), target])
            return

        if not is_git_repo(target):
            raise RuntimeError(f"Path exists but is not a git repository: {target}")

        if local_only:
            log_step(f"Using local repository {repo}")
            return

        log_step(f"Fetching {repo}")
        run_or_throw(["git", "fetch", "--all", "--prune"], cwd=target)

    def ensure_dual_push_urls(repo: str) -> None:
        target = repo_dir(repo)
        gh = github_url(repo)
        cb = codeberg_url(repo)

        remotes = run_or_throw(["git", "remote"], cwd=target, quiet=True).split("\n")
        remotes = [r.strip() for r in remotes if r.strip()]

        if "origin" not in remotes:
            run_or_throw(["git", "remote", "add", "origin", gh], cwd=target)

        run_or_throw(["git", "remote", "set-url", "origin", gh], cwd=target)

        subprocess.run(
            ["git", "-C", target, "config", "--unset-all", "remote.origin.pushurl"],
            capture_output=True,
        )

        run_or_throw(
            ["git", "remote", "set-url", "--add", "--push", "origin", gh], cwd=target
        )
        run_or_throw(
            ["git", "remote", "set-url", "--add", "--push", "origin", cb], cwd=target
        )

    log_step("Checking workstation bootstrap prerequisites")
    required = ["git", "ssh"] + (["python3"] if restore_ssh else [])
    for tool in required:
        if not command_exists(tool):
            raise RuntimeError(f"Missing required tool: {tool}")
        print(f"ok: {tool}")

    log_step("Ensuring projects root")
    Path(github_root).mkdir(parents=True, exist_ok=True)
    print(f"root: {github_root}")

    clone_or_fetch(anchor_repo)
    if str(Path(repo_dir(anchor_repo)).resolve()) != script_repo_root:
        print(f"note: running from {script_repo_root}")
        print(f"note: canonical anchor is {Path(repo_dir(anchor_repo)).resolve()}")

    if restore_ssh:
        log_step("Restoring encrypted SSH backup")
        run_or_throw(
            ["python3", "-m", "scripts", "setup:ssh_restore"], cwd=script_repo_root
        )

    clone_or_fetch(profile_repo)

    index_path = Path(repos_index_path)
    parsed = (
        parse_repos_from_index(index_path.read_text()) if index_path.exists() else []
    )

    if not parsed:
        if not use_fallback:
            raise RuntimeError(
                f"No repositories parsed from {repos_index_path}. "
                "Re-run with USE_FALLBACK=1 to load the built-in discovery list."
            )

        synced = _unique([anchor_repo, profile_repo, *managed_project_repos])
        discovered = _unique([*synced, *_discover_repos(github_root)])
        source = "fallback"

        log_step("Repository set")
        print(f"warning: using fallback discovery list from {repos_index_path}")
        print(
            "warning: fallback mode is discovery-only; only anchor/profile/managed repos will be cloned"
        )
        for repo in discovered:
            print(f"- {repo}")
    else:
        synced = _unique([anchor_repo, profile_repo, *managed_project_repos, *parsed])
        discovered = synced
        source = "index"

        log_step("Repository set")
        for repo in synced:
            print(f"- {repo}")

    for repo in synced:
        if repo in (anchor_repo, profile_repo):
            continue
        clone_or_fetch(repo)

    log_step("Enforcing dual push URL policy")
    for repo in synced:
        ensure_dual_push_urls(repo)

    log_step("Remote summary")
    for repo in synced:
        push_urls = run_or_throw(
            ["git", "remote", "get-url", "--all", "--push", "origin"],
            cwd=repo_dir(repo),
            quiet=True,
        )
        urls = " | ".join(
            line.strip() for line in push_urls.split("\n") if line.strip()
        )
        print(f"{repo}: {urls}")

    if source == "fallback":
        synced_set = set(synced)
        discovery_only = [r for r in discovered if r not in synced_set]
        if discovery_only:
            log_step("Fallback discovery-only repositories")
            for repo in discovery_only:
                target = repo_dir(repo)
                present = is_git_repo(target)
                print(f"{repo}: {'present' if present else 'missing'} ({target})")

    log_step("Workstation bootstrap complete")
    if local_only:
        print("mode: local-only")
    if source == "fallback":
        print("mode: fallback-discovery-only")
    print("next: python3 -m scripts bootstrap")
