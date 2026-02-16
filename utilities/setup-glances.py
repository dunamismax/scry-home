#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = [
#   "rich",
# ]
# ///
"""Clone, install, and configure Glances (system monitoring tool).

Fully automated -- run this on a fresh environment to get Glances ready.
Requires: uv, git

Usage: uv run utilities/setup-glances.py
"""

import subprocess
import sys
from pathlib import Path

from rich.console import Console

console = Console()

SCRIPT_DIR = Path(__file__).resolve().parent
GLANCES_DIR = SCRIPT_DIR / "glances"
GLANCES_REPO = "https://github.com/nicolargo/glances.git"
VENV_DIR = GLANCES_DIR / ".venv"


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    """Run a command, printing it first. Exits on failure."""
    console.print(f"  [dim]$ {' '.join(cmd)}[/dim]")
    result = subprocess.run(cmd, **kwargs)
    if result.returncode != 0:
        console.print(f"[red bold]Command failed with exit code {result.returncode}[/red bold]")
        sys.exit(result.returncode)
    return result


def clone_or_update() -> None:
    if not GLANCES_DIR.exists():
        console.print("[cyan]Cloning Glances...[/cyan]")
        run(["git", "clone", GLANCES_REPO, str(GLANCES_DIR)])
    else:
        console.print("[cyan]Glances already cloned. Pulling latest...[/cyan]")
        run(["git", "-C", str(GLANCES_DIR), "pull", "--ff-only"])


def setup_venv() -> None:
    if not VENV_DIR.exists():
        console.print("[cyan]Creating venv with uv...[/cyan]")
        run(["uv", "venv", str(VENV_DIR)])

    console.print("[cyan]Installing Glances with all features...[/cyan]")
    run(["uv", "pip", "install", "--python", str(VENV_DIR / "bin" / "python"), "glances[all]"])


def main() -> None:
    console.rule("[bold green]Glances Setup[/bold green]")

    clone_or_update()
    setup_venv()

    run_script = GLANCES_DIR / "run-glances.py"
    console.print()
    console.rule("[bold green]Setup Complete[/bold green]")
    console.print(f"\nRun Glances with: [bold]uv run {run_script}[/bold]")


if __name__ == "__main__":
    main()
