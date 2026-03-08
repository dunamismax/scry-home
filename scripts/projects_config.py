"""Managed project definitions for the scry-home CLI."""

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
    ManagedProject(
        name="scry-home",
        path=GITHUB / "scry-home",
        install_command=["uv", "sync"],
        verify_commands=[
            ["uv", "run", "ruff", "check", "."],
            ["uv", "run", "python", "-m", "scripts", "doctor"],
        ],
    ),
    ManagedProject(
        name="dunamismax",
        path=GITHUB / "dunamismax",
        install_command=["echo", "no install needed"],
        verify_commands=[],
    ),
    ManagedProject(
        name="boring-go-web",
        path=GITHUB / "boring-go-web",
        install_command=["go", "mod", "download"],
        verify_commands=[["go", "test", "./..."]],
    ),
    ManagedProject(
        name="c-from-the-ground-up",
        path=GITHUB / "c-from-the-ground-up",
        install_command=["echo", "no install needed"],
        verify_commands=[],
    ),
    ManagedProject(
        name="scryfall-discord-bot",
        path=GITHUB / "scryfall-discord-bot",
        install_command=["uv", "sync"],
        verify_commands=[
            ["uv", "run", "ruff", "check", "."],
            ["uv", "run", "mypy", "oracle"],
        ],
    ),
    ManagedProject(
        name="hello-world-from-hell",
        path=GITHUB / "hello-world-from-hell",
        install_command=["echo", "no install needed"],
        verify_commands=[["make", "test"]],
    ),
    ManagedProject(
        name="trade-desk-cli",
        path=GITHUB / "trade-desk-cli",
        install_command=["uv", "sync", "--all-extras"],
        verify_commands=[
            ["uv", "run", "pytest"],
            ["uv", "run", "mypy", "src"],
            ["uv", "run", "ruff", "check", "src", "tests"],
        ],
    ),
    ManagedProject(
        name="Sawyer-Visual-Media",
        path=GITHUB / "Sawyer-Visual-Media",
        install_command=["echo", "no install needed"],
        verify_commands=[],
    ),
    ManagedProject(
        name="openclaw",
        path=GITHUB / "openclaw",
        install_command=["echo", "managed in openclaw repo"],
        verify_commands=[],
    ),
]
