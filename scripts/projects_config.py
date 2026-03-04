"""Managed project definitions for grimoire CLI."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

GITHUB = Path.home() / "github"


@dataclass
class ManagedProject:
    name: str
    path: Path
    install_command: list[str]
    verify_commands: list[list[str]] = field(default_factory=list)


MANAGED_PROJECTS: list[ManagedProject] = [
    # --- TypeScript Web Apps ---
    ManagedProject(
        name="podwatch",
        path=GITHUB / "podwatch",
        install_command=["bun", "install"],
        verify_commands=[["bun", "run", "lint"], ["bun", "run", "typecheck"]],
    ),
    ManagedProject(
        name="rip",
        path=GITHUB / "rip",
        install_command=["bun", "install"],
        verify_commands=[["bun", "run", "lint"], ["bun", "run", "typecheck"]],
    ),
    # --- Chess Platform ---
    ManagedProject(
        name="elchess",
        path=GITHUB / "elchess",
        install_command=["bun", "install"],
        verify_commands=[["bun", "run", "lint"], ["bun", "run", "typecheck"]],
    ),
    # --- Mobile ---
    ManagedProject(
        name="CallRift",
        path=GITHUB / "CallRift",
        install_command=["bun", "install"],
        verify_commands=[["bun", "run", "lint"], ["bun", "run", "typecheck"]],
    ),
    # --- CI Pipeline ---
    ManagedProject(
        name="pr-firefighter",
        path=GITHUB / "pr-firefighter",
        install_command=["bun", "install"],
        verify_commands=[["bun", "run", "lint"], ["bun", "run", "typecheck"]],
    ),
    # --- Ops CLI ---
    ManagedProject(
        name="grimoire",
        path=GITHUB / "grimoire",
        install_command=["bun", "install"],
        verify_commands=[["bun", "run", "lint"], ["bun", "run", "typecheck"]],
    ),
    # --- Content ---
    ManagedProject(
        name="Sawyer-Visual-Media",
        path=GITHUB / "Sawyer-Visual-Media",
        install_command=["bun", "install"],
        verify_commands=[],
    ),
    # --- Python ---
    ManagedProject(
        name="scripts",
        path=GITHUB / "scripts",
        install_command=["echo", "no install needed"],
        verify_commands=[["ruff", "check", "."]],
    ),
    ManagedProject(
        name="augur",
        path=GITHUB / "augur",
        install_command=["uv", "sync"],
        verify_commands=[
            ["uv", "run", "ruff", "check", "."],
            ["uv", "run", "mypy", "."],
        ],
    ),
]
