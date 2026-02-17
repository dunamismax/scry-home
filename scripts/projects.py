from __future__ import annotations

import sys
from pathlib import Path

from scripts.lib import log_step, run_or_throw
from scripts.projects_config import ManagedProject, managed_projects


def _is_project_repo(project: ManagedProject) -> bool:
    return Path(project.path).is_dir() and Path(project.path, ".git").is_dir()


def _ensure_project(project: ManagedProject, *, optional: bool) -> bool:
    if _is_project_repo(project):
        return True
    message = f"missing: {project.name} ({project.path})"
    if optional:
        print(f"skip: {message}")
        return False
    raise RuntimeError(message)


def _list_projects() -> None:
    log_step("Managed projects")
    if not managed_projects:
        print("(none configured)")
        return
    for project in managed_projects:
        print(f"{project.name}: {project.path}")


def _install_projects(*, optional: bool) -> None:
    log_step("Install managed project dependencies")
    if not managed_projects:
        print("(none configured)")
        return
    for project in managed_projects:
        if not _ensure_project(project, optional=optional):
            continue
        print(f"project: {project.name}")
        run_or_throw(project.install_command, cwd=project.path)


def _verify_projects(*, optional: bool) -> None:
    log_step("Run managed project verification")
    if not managed_projects:
        print("(none configured)")
        return
    for project in managed_projects:
        if not _ensure_project(project, optional=optional):
            continue
        print(f"project: {project.name}")
        for command in project.verify_commands:
            run_or_throw(command, cwd=project.path)


def _doctor_projects() -> None:
    log_step("Managed project health")
    if not managed_projects:
        print("(none configured)")
        return
    for project in managed_projects:
        present = _is_project_repo(project)
        print(f"{project.name}: {'ok' if present else 'missing'} ({project.path})")
        if not present:
            continue
        branch = run_or_throw(["git", "-C", project.path, "branch", "--show-current"], quiet=True)
        push_urls = run_or_throw(
            ["git", "-C", project.path, "remote", "get-url", "--all", "--push", "origin"],
            quiet=True,
        )
        urls = " | ".join(line for line in push_urls.splitlines() if line)
        print(f"branch: {branch}")
        print(f"push: {urls}")


def cmd_list() -> None:
    _list_projects()


def cmd_doctor() -> None:
    _doctor_projects()


def cmd_install() -> None:
    optional = "--optional" in sys.argv
    _install_projects(optional=optional)


def cmd_verify() -> None:
    optional = "--optional" in sys.argv
    _verify_projects(optional=optional)


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    optional = "--optional" in sys.argv

    command = args[0] if args else "list"
    match command:
        case "list":
            _list_projects()
        case "install":
            _install_projects(optional=optional)
        case "verify":
            _verify_projects(optional=optional)
        case "doctor":
            _doctor_projects()
        case _:
            raise RuntimeError(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
