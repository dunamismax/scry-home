"""Managed project operations: list, install, verify, doctor."""

from __future__ import annotations

from scripts.common import has_env, is_git_repo, log_step, run_or_throw
from scripts.projects_config import MANAGED_PROJECTS


def _optional_mode() -> bool:
    return has_env("OPTIONAL")


def _require_project_repo(name: str, path: str) -> None:
    if is_git_repo(path):
        return

    message = f"missing: {name} ({path})"
    if _optional_mode():
        print(f"skip: {message}")
        return

    raise RuntimeError(message)


def list_projects() -> None:
    log_step("Managed projects")
    if not MANAGED_PROJECTS:
        print("(none configured)")
        return

    for project in MANAGED_PROJECTS:
        print(f"{project.name}: {project.path}")


def install_projects() -> None:
    log_step("Install managed project dependencies")
    if not MANAGED_PROJECTS:
        print("(none configured)")
        return

    for project in MANAGED_PROJECTS:
        path = str(project.path)
        if not is_git_repo(path):
            _require_project_repo(project.name, path)
            continue

        print(f"project: {project.name}")
        run_or_throw(project.install_command, cwd=path)


def verify_projects() -> None:
    log_step("Run managed project verification")
    if not MANAGED_PROJECTS:
        print("(none configured)")
        return

    for project in MANAGED_PROJECTS:
        path = str(project.path)
        if not is_git_repo(path):
            _require_project_repo(project.name, path)
            continue

        print(f"project: {project.name}")
        for command in project.verify_commands:
            run_or_throw(command, cwd=path)


def doctor_projects() -> None:
    log_step("Managed project health")
    if not MANAGED_PROJECTS:
        print("(none configured)")
        return

    for project in MANAGED_PROJECTS:
        path = str(project.path)
        present = is_git_repo(path)
        status = "ok" if present else "missing"
        print(f"{project.name}: {status} ({path})")
        if not present:
            continue

        branch = run_or_throw(["git", "branch", "--show-current"], cwd=path, quiet=True)

        push_urls = run_or_throw(
            ["git", "remote", "get-url", "--all", "--push", "origin"],
            cwd=path,
            quiet=True,
        )

        urls = " | ".join(
            line.strip() for line in push_urls.split("\n") if line.strip()
        )
        print(f"branch: {branch}")
        print(f"push: {urls}")
