from __future__ import annotations

from pathlib import Path

from scripts.lib import command_exists, log_step, run_or_throw
from scripts.projects_config import managed_projects

REPO_ROOT = Path(__file__).resolve().parent.parent
CHECKS = ["python3", "uv", "docker", "git"]


def main() -> None:
    log_step("Toolchain status")
    for tool in CHECKS:
        if not command_exists(tool):
            print(f"missing: {tool}")
            continue
        version = run_or_throw([tool, "--version"], quiet=True).splitlines()[0]
        print(f"{tool}: {version}")

    log_step("Infra files")
    infra_files = [
        "infra/docker-compose.yml",
        "infra/.env.example",
        "infra/.env",
    ]
    for f in infra_files:
        full = REPO_ROOT / f
        print(f"{f}: {'ok' if full.exists() else 'missing'}")

    log_step("Managed projects")
    if not managed_projects:
        print("(none configured)")
        return
    for project in managed_projects:
        has_repo = Path(project.path).is_dir() and Path(project.path, ".git").is_dir()
        print(f"{project.name}: {'ok' if has_repo else 'missing'} ({project.path})")
        if not has_repo:
            continue
        branch = run_or_throw(["git", "-C", project.path, "branch", "--show-current"], quiet=True)
        push_urls = run_or_throw(
            ["git", "-C", project.path, "remote", "get-url", "--all", "--push", "origin"],
            quiet=True,
        )
        urls = " | ".join(line for line in push_urls.splitlines() if line)
        print(f"branch: {branch}")
        print(f"push: {urls}")


if __name__ == "__main__":
    main()
