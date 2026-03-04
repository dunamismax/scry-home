"""Check and fix dual push URL remotes across all repos in ~/github."""

from __future__ import annotations

import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from scripts.common import is_git_repo, log_step, run_or_throw

DEFAULTS = {
    "root": str(Path.home() / "github"),
    "owner": "dunamismax",
    "gh_alias": "github.com-dunamismax",
    "cb_alias": "codeberg.org-dunamismax",
}


@dataclass
class RepoResult:
    name: str
    status: str  # "ok" | "skip" | "fixed" | "error"
    detail: str = ""


def _get_remote_urls(repo_path: str) -> dict[str, list[str] | str] | None:
    try:
        fetch_url = run_or_throw(
            ["git", "-C", repo_path, "remote", "get-url", "origin"], quiet=True
        )
        push_raw = run_or_throw(
            ["git", "-C", repo_path, "remote", "get-url", "--push", "--all", "origin"],
            quiet=True,
        )
        push_urls = [line.strip() for line in push_raw.split("\n") if line.strip()]
        return {"fetch_url": fetch_url, "push_urls": push_urls}
    except RuntimeError:
        return None


def _configure_remote(repo_path: str, gh_url: str, cb_url: str) -> None:
    run_or_throw(
        ["git", "-C", repo_path, "remote", "set-url", "origin", gh_url], quiet=True
    )

    # Clear all push URLs then re-add both
    subprocess.run(
        ["git", "-C", repo_path, "config", "--unset-all", "remote.origin.pushurl"],
        capture_output=True,
    )

    run_or_throw(
        [
            "git",
            "-C",
            repo_path,
            "remote",
            "set-url",
            "--add",
            "--push",
            "origin",
            gh_url,
        ],
        quiet=True,
    )
    run_or_throw(
        [
            "git",
            "-C",
            repo_path,
            "remote",
            "set-url",
            "--add",
            "--push",
            "origin",
            cb_url,
        ],
        quiet=True,
    )


def _expected_urls(repo_name: str) -> tuple[str, str]:
    gh_url = f"git@{DEFAULTS['gh_alias']}:{DEFAULTS['owner']}/{repo_name}.git"
    cb_url = f"git@{DEFAULTS['cb_alias']}:{DEFAULTS['owner']}/{repo_name}.git"
    return gh_url, cb_url


def _is_correct(urls: dict, gh_url: str, cb_url: str) -> bool:
    if urls["fetch_url"] != gh_url:
        return False
    push = urls["push_urls"]
    if len(push) != 2:
        return False
    return push[0] == gh_url and push[1] == cb_url


def _process_repo(repo_path: str, fix: bool) -> RepoResult:
    name = Path(repo_path).name

    if not is_git_repo(repo_path):
        return RepoResult(name, "skip", "not a git repo")

    urls = _get_remote_urls(repo_path)
    if urls is None:
        return RepoResult(name, "skip", "no origin remote")

    gh_url, cb_url = _expected_urls(name)

    if _is_correct(urls, gh_url, cb_url):
        return RepoResult(name, "ok")

    if not fix:
        issues: list[str] = []
        if urls["fetch_url"] != gh_url:
            issues.append(f"fetch: {urls['fetch_url']} (want {gh_url})")
        push = urls["push_urls"]
        if len(push) != 2:
            issues.append(f"push url count: {len(push)} (want 2)")
        else:
            if push[0] != gh_url:
                issues.append(f"push[0]: {push[0]} (want {gh_url})")
            if push[1] != cb_url:
                issues.append(f"push[1]: {push[1]} (want {cb_url})")
        return RepoResult(name, "error", "; ".join(issues))

    try:
        _configure_remote(repo_path, gh_url, cb_url)
        return RepoResult(name, "fixed")
    except RuntimeError as exc:
        return RepoResult(name, "error", str(exc))


def _discover_repos(root: str) -> list[str]:
    root_path = Path(root)
    return sorted(
        str(p) for p in root_path.iterdir() if p.is_dir() and not p.name.startswith(".")
    )


def sync_remotes() -> None:
    fix = "--fix" in sys.argv
    root = DEFAULTS["root"]

    log_step(
        "Syncing dual remotes (fix mode)"
        if fix
        else "Checking dual remotes (dry run — pass --fix to apply)"
    )

    print(f"  root:     {root}")
    print(f"  owner:    {DEFAULTS['owner']}")
    print(f"  github:   {DEFAULTS['gh_alias']}")
    print(f"  codeberg: {DEFAULTS['cb_alias']}")

    repos = _discover_repos(root)
    results = [_process_repo(r, fix) for r in repos]

    print()

    ok = [r for r in results if r.status == "ok"]
    fixed = [r for r in results if r.status == "fixed"]
    skipped = [r for r in results if r.status == "skip"]
    errors = [r for r in results if r.status == "error"]

    for r in ok:
        print(f"  [ok]    {r.name}")
    for r in fixed:
        print(f"  [fixed] {r.name}")
    for r in skipped:
        print(f"  [skip]  {r.name} — {r.detail}")
    for r in errors:
        print(f"  [error] {r.name} — {r.detail}")

    print(
        f"\n  ok={len(ok)} fixed={len(fixed)} skipped={len(skipped)} errors={len(errors)}"
    )

    if errors:
        sys.exit(1)
