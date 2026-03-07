"""Scaffold CAB / Change Factory packets for managed projects."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from scripts.common import (
    ensure_dir,
    get_argv,
    git_remote_push_urls,
    is_git_repo,
    log_step,
    run_or_throw,
)
from scripts.projects_config import MANAGED_PROJECTS, ManagedProject

REPO_ROOT = Path(__file__).resolve().parents[2]
REFERENCE_ROOT = REPO_ROOT / "reference" / "cab"
TEMPLATES_ROOT = REFERENCE_ROOT / "templates"
DEFAULT_OUTPUT_ROOT = REPO_ROOT / "artifacts" / "cab"


@dataclass
class CabArgs:
    project_name: str
    packet_name: str
    output_root: Path
    dry_run: bool


@dataclass
class ProjectSnapshot:
    project: ManagedProject
    branch: str
    worktree_state: str
    origin_push_urls: list[str]
    fork_push_urls: list[str]


def _slugify(value: str) -> str:
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-")


def _usage() -> str:
    return (
        "Usage: uv run python -m scripts cab:new "
        "--project=<managed-project> --packet=<packet-name> "
        "[--output=<path>] [--dry-run]"
    )


def _parse_args() -> CabArgs:
    args = get_argv()[2:]
    project_name = ""
    packet_name = ""
    output_root = DEFAULT_OUTPUT_ROOT
    dry_run = False

    for arg in args:
        if arg == "--dry-run":
            dry_run = True
            continue
        if arg.startswith("--project="):
            project_name = arg.removeprefix("--project=").strip()
            continue
        if arg.startswith("--packet="):
            packet_name = arg.removeprefix("--packet=").strip()
            continue
        if arg.startswith("--output="):
            output_root = Path(arg.removeprefix("--output=")).expanduser()
            continue
        raise RuntimeError(f"Unknown flag: {arg}\n{_usage()}")

    if not project_name or not packet_name:
        raise RuntimeError(f"Missing required flags.\n{_usage()}")

    return CabArgs(
        project_name=project_name,
        packet_name=packet_name,
        output_root=output_root,
        dry_run=dry_run,
    )


def _find_project(project_name: str) -> ManagedProject:
    for project in MANAGED_PROJECTS:
        if project.name == project_name:
            return project

    available = ", ".join(project.name for project in MANAGED_PROJECTS)
    raise RuntimeError(f"Unknown managed project: {project_name}\nAvailable projects: {available}")


def _git_stdout(project_path: Path, *args: str) -> str:
    return run_or_throw(["git", "-c", "core.fsmonitor=false", *args], cwd=project_path, quiet=True)


def _snapshot_project(project: ManagedProject) -> ProjectSnapshot:
    if not is_git_repo(project.path):
        raise RuntimeError(
            f"Managed project is missing or not a git repo: {project.name} ({project.path})"
        )

    branch = _git_stdout(project.path, "branch", "--show-current")
    status = _git_stdout(project.path, "status", "--short")
    worktree_state = "clean" if not status else "dirty"

    return ProjectSnapshot(
        project=project,
        branch=branch or "(detached)",
        worktree_state=worktree_state,
        origin_push_urls=git_remote_push_urls(project.path, "origin"),
        fork_push_urls=git_remote_push_urls(project.path, "fork"),
    )


def _packet_dir(output_root: Path, project_name: str, packet_name: str) -> Path:
    today = date.today().isoformat()
    packet_slug = _slugify(packet_name)
    project_slug = _slugify(project_name)
    return output_root / f"{today}-{project_slug}-{packet_slug}"


def _today_human() -> str:
    today = date.today()
    return f"{today:%B} {today.day}, {today:%Y}"


def _bullet_list(items: list[str], empty_text: str) -> str:
    if not items:
        return f"- {empty_text}"
    return "\n".join(f"- `{item}`" for item in items)


def _command_list(commands: list[list[str]], empty_text: str) -> str:
    if not commands:
        return f"- {empty_text}"
    return "\n".join(f"- `{' '.join(command)}`" for command in commands)


def _project_context(
    snapshot: ProjectSnapshot, packet_name: str, output_dir: Path
) -> dict[str, str]:
    project = snapshot.project
    return {
        "PACKET_NAME": packet_name,
        "PACKET_SLUG": output_dir.name,
        "PACKET_DATE": date.today().isoformat(),
        "PACKET_DATE_HUMAN": _today_human(),
        "PACKET_PATH": str(output_dir),
        "PROJECT_NAME": project.name,
        "PROJECT_PATH": str(project.path),
        "PROJECT_BRANCH": snapshot.branch,
        "PROJECT_WORKTREE_STATE": snapshot.worktree_state,
        "PROJECT_INSTALL_COMMAND": " ".join(project.install_command),
        "PROJECT_VERIFY_COMMANDS": _command_list(
            project.verify_commands, "No repo-specific verify commands are registered yet."
        ),
        "PROJECT_ORIGIN_PUSH_URLS": _bullet_list(
            snapshot.origin_push_urls, "No origin push URLs configured."
        ),
        "PROJECT_FORK_PUSH_URLS": _bullet_list(
            snapshot.fork_push_urls, "No fork remote configured."
        ),
        "REPO_ROOT": str(REPO_ROOT),
        "CAB_WORKFLOW_DOC": "reference/cab/WORKFLOW.md",
        "RESEARCH_FORGE_NOTE": (
            "Research Forge is folded into this packet: use `09-research-memo.md` and "
            "`research/source-log.md` instead of creating a separate research workflow."
        ),
        "PROJECT_CONTROL_PLANE_COMMANDS": "\n".join(
            [
                "- `uv run python -m scripts doctor`",
                "- `uv run python -m scripts projects:doctor`",
                f"- `cd {project.path} && {' '.join(project.verify_commands[0])}`"
                if project.verify_commands
                else "- Add project-specific verification once this repo has one.",
            ]
        ),
    }


def _render_template(template: str, context: dict[str, str]) -> str:
    rendered = template
    for key, value in context.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)
    return rendered


def _scaffold_paths() -> list[Path]:
    return sorted(path for path in TEMPLATES_ROOT.rglob("*") if path.is_file())


def cab_new() -> None:
    args = _parse_args()
    project = _find_project(args.project_name)
    snapshot = _snapshot_project(project)
    output_dir = _packet_dir(args.output_root, project.name, args.packet_name)
    context = _project_context(snapshot, args.packet_name, output_dir)
    template_paths = _scaffold_paths()

    log_step("CAB packet scaffold")
    print(f"project: {project.name}")
    print(f"packet: {args.packet_name}")
    print(f"output: {output_dir}")
    print(f"mode: {'dry-run' if args.dry_run else 'write'}")
    print()

    if args.dry_run:
        print("would create:")
        for template_path in template_paths:
            relative = template_path.relative_to(TEMPLATES_ROOT)
            print(f"- {output_dir / relative}")
        return

    if output_dir.exists():
        raise RuntimeError(
            f"Packet already exists: {output_dir}\n"
            "Choose a different --packet name or remove the existing packet first."
        )

    ensure_dir(output_dir)
    for template_path in template_paths:
        relative = template_path.relative_to(TEMPLATES_ROOT)
        target_path = output_dir / relative
        ensure_dir(target_path.parent)
        rendered = _render_template(template_path.read_text(), context)
        target_path.write_text(rendered)

    print("created:")
    for template_path in template_paths:
        relative = template_path.relative_to(TEMPLATES_ROOT)
        print(f"- {output_dir / relative}")
