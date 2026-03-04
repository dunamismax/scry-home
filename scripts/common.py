"""Shared utilities for grimoire scripts."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path


def log_step(message: str) -> None:
    print(f"\n==> {message}")


def ensure_dir(path: str | Path) -> None:
    Path(path).mkdir(parents=True, exist_ok=True)


def ensure_parent_dir(path: str | Path) -> None:
    ensure_dir(Path(path).parent)


def run_or_throw(
    command: list[str],
    *,
    cwd: str | Path | None = None,
    env: dict[str, str] | None = None,
    quiet: bool = False,
) -> str:
    if not quiet:
        print(f"$ {' '.join(command)}")

    merged_env = {**os.environ, **(env or {})}

    result = subprocess.run(
        command,
        cwd=cwd,
        env=merged_env,
        capture_output=True,
        text=True,
    )

    stdout = result.stdout.strip()
    stderr = result.stderr.strip()

    if result.returncode != 0:
        if stdout:
            print(stdout, file=sys.stderr)
        if stderr:
            print(stderr, file=sys.stderr)
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(command)}")

    return stdout


def command_exists(binary: str) -> bool:
    return shutil.which(binary) is not None


def has_env(name: str) -> bool:
    return name in os.environ


def fail(message: str) -> None:
    raise RuntimeError(message)


def is_git_repo(path: str | Path) -> bool:
    p = Path(path)
    return p.exists() and (p / ".git").exists()


def get_argv() -> list[str]:
    """Return sys.argv for argument parsing."""
    return sys.argv
