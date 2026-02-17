from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class ManagedProject:
    name: str
    path: str
    install_command: list[str]
    verify_commands: list[list[str]] = field(default_factory=list)


_home = os.environ.get("HOME", "/home/sawyer")
_github_root = os.environ.get("GITHUB_ROOT", str(Path(_home, "github")))

# Add managed project repos here as they are created.
managed_projects: list[ManagedProject] = []
