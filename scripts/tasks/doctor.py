"""Health check for toolchain, core files, and managed projects."""

from __future__ import annotations

from pathlib import Path

from scripts.common import (
    command_exists,
    git_remote_push_urls,
    log_step,
    run_or_throw,
)
from scripts.projects_config import MANAGED_PROJECTS


def doctor() -> None:
    log_step("Toolchain status")
    for tool in ["git", "docker", "python3", "ruff", "uv"]:
        if not command_exists(tool):
            print(f"missing: {tool}")
            continue

        version = run_or_throw([tool, "--version"], quiet=True).split("\n")[0]
        print(f"{tool}: {version}")

    log_step("Core files")
    cwd = Path.cwd()
    for file in ["SOUL.md", "AGENTS.md", "README.md", "scripts/cli.py"]:
        status = "ok" if (cwd / file).exists() else "missing"
        print(f"{file}: {status}")

    log_step("Managed projects")
    if not MANAGED_PROJECTS:
        print("(none configured)")
        return

    for project in MANAGED_PROJECTS:
        has_repo = project.path.exists() and (project.path / ".git").exists()
        status = "ok" if has_repo else "missing"
        print(f"{project.name}: {status} ({project.path})")
        if not has_repo:
            continue

        branch = run_or_throw(
            ["git", "branch", "--show-current"], cwd=str(project.path), quiet=True
        )

        print(f"branch: {branch}")

        origin_urls = git_remote_push_urls(str(project.path), "origin")
        if origin_urls:
            print(f"push(origin): {' | '.join(origin_urls)}")

        fork_urls = git_remote_push_urls(str(project.path), "fork")
        if fork_urls:
            print(f"push(fork): {' | '.join(fork_urls)}")
