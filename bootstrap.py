#!/usr/bin/env python3
"""Bootstrap a fresh environment from zero to fully operational.

This is the first thing to run after cloning the Claude repo onto a new machine.
Installs uv, Python, Ruff, and runs all utility setup scripts.

Stdlib only -- no third-party dependencies. This script must work on a bare
Ubuntu system with nothing but python3 installed.

Usage:
    git clone https://github.com/dunamismax/Claude.git ~/github/Claude
    cd ~/github/Claude
    python3 bootstrap.py

Idempotent -- safe to run multiple times. Skips anything already installed.
"""

import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# ANSI helpers (stdlib only -- no Rich available before uv is installed)
# ---------------------------------------------------------------------------

BOLD = "\033[1m"
DIM = "\033[2m"
GREEN = "\033[32m"
CYAN = "\033[36m"
YELLOW = "\033[33m"
RED = "\033[31m"
RESET = "\033[0m"

PYTHON_VERSION = "3.13"
REPO_ROOT = Path(__file__).resolve().parent
UTILITIES_DIR = REPO_ROOT / "utilities"


def header(msg: str) -> None:
    width = 60
    line = "─" * width
    print(f"\n{CYAN}{line}{RESET}", flush=True)
    print(f"{CYAN}{BOLD}  {msg}{RESET}", flush=True)
    print(f"{CYAN}{line}{RESET}", flush=True)


def step(msg: str) -> None:
    print(f"\n{BOLD}▸ {msg}{RESET}", flush=True)


def ok(msg: str) -> None:
    print(f"  {GREEN}✓{RESET} {msg}", flush=True)


def skip(msg: str) -> None:
    print(f"  {DIM}⏭ {msg} (already done){RESET}", flush=True)


def warn(msg: str) -> None:
    print(f"  {YELLOW}⚠ {msg}{RESET}", flush=True)


def fail(msg: str) -> None:
    print(f"  {RED}✗ {msg}{RESET}", flush=True)


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
    print(f"  {DIM}$ {' '.join(cmd)}{RESET}", flush=True)
    return subprocess.run(cmd, **kwargs)


def cmd_exists(name: str) -> bool:
    return shutil.which(name) is not None


def ensure_path() -> None:
    """Ensure ~/.local/bin is on PATH for the rest of this process."""
    local_bin = Path.home() / ".local" / "bin"
    cargo_bin = Path.home() / ".cargo" / "bin"
    current_path = os.environ.get("PATH", "")

    additions = []
    for p in [local_bin, cargo_bin]:
        if p.exists() and str(p) not in current_path:
            additions.append(str(p))

    if additions:
        os.environ["PATH"] = ":".join(additions) + ":" + current_path


# ---------------------------------------------------------------------------
# Installation steps
# ---------------------------------------------------------------------------


def check_prerequisites() -> None:
    step("Checking prerequisites")

    if not cmd_exists("git"):
        fail("git is not installed. Install it with: sudo apt install git")
        sys.exit(1)
    ok("git found")

    if not cmd_exists("curl"):
        fail("curl is not installed. Install it with: sudo apt install curl")
        sys.exit(1)
    ok("curl found")

    system = platform.system()
    if system != "Linux":
        warn(f"Detected {system} -- this script is designed for Ubuntu/Linux")
    else:
        ok(f"Running on {system}")


def install_uv() -> None:
    step("Installing uv (by Astral)")

    if cmd_exists("uv"):
        result = run(["uv", "--version"], capture_output=True, text=True)
        version = result.stdout.strip() if result.returncode == 0 else "unknown"
        skip(f"uv {version}")

        # Self-update to latest
        step("Updating uv to latest version")
        result = run(["uv", "self", "update"], capture_output=True, text=True)
        if result.returncode == 0:
            ok("uv is up to date")
        else:
            warn("uv self-update failed -- continuing with current version")
        return

    result = run(
        ["sh", "-c", "curl -LsSf https://astral.sh/uv/install.sh | sh"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail("Failed to install uv")
        print(result.stderr)
        sys.exit(1)

    ensure_path()

    if not cmd_exists("uv"):
        fail("uv installed but not found on PATH. Restart your shell and try again.")
        sys.exit(1)

    version_result = run(["uv", "--version"], capture_output=True, text=True)
    ok(f"uv installed ({version_result.stdout.strip()})")


def install_python() -> None:
    step(f"Installing Python {PYTHON_VERSION}")

    result = run(
        ["uv", "python", "find", PYTHON_VERSION],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        python_path = result.stdout.strip()
        skip(f"Python {PYTHON_VERSION} found at {python_path}")
        return

    result = run(["uv", "python", "install", PYTHON_VERSION])
    if result.returncode != 0:
        fail(f"Failed to install Python {PYTHON_VERSION}")
        sys.exit(1)

    ok(f"Python {PYTHON_VERSION} installed")


def install_ruff() -> None:
    step("Installing Ruff (by Astral)")

    result = run(
        ["uv", "tool", "list"],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0 and "ruff" in result.stdout:
        skip("Ruff already installed as uv tool")
        # Upgrade to latest
        run(["uv", "tool", "upgrade", "ruff"], capture_output=True)
        ok("Ruff upgraded to latest")
        return

    result = run(["uv", "tool", "install", "ruff"])
    if result.returncode != 0:
        fail("Failed to install Ruff")
        sys.exit(1)

    ok("Ruff installed")


def run_utility_setup_scripts() -> None:
    step("Running utility setup scripts")

    if not UTILITIES_DIR.exists():
        warn("No utilities/ directory found -- skipping")
        return

    setup_scripts = sorted(UTILITIES_DIR.glob("setup-*.py"))
    if not setup_scripts:
        warn("No setup-*.py scripts found in utilities/")
        return

    for script in setup_scripts:
        tool_name = script.stem.replace("setup-", "")
        step(f"Setting up {tool_name}")
        result = run(["uv", "run", str(script)])
        if result.returncode != 0:
            fail(f"Setup script failed: {script.name}")
        else:
            ok(f"{tool_name} is ready")


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


def print_summary() -> None:
    header("Bootstrap Complete")

    uv_ver = subprocess.run(
        ["uv", "--version"], capture_output=True, text=True
    ).stdout.strip()

    py_path = subprocess.run(
        ["uv", "python", "find", PYTHON_VERSION], capture_output=True, text=True
    ).stdout.strip()

    ruff_ver = subprocess.run(
        ["ruff", "--version"], capture_output=True, text=True
    ).stdout.strip()

    print(f"""
  {BOLD}Installed tools:{RESET}
    uv      → {uv_ver}
    python  → {py_path}
    ruff    → {ruff_ver}

  {BOLD}Next steps:{RESET}
    • Restart your shell (or run: {DIM}source ~/.bashrc{RESET})
    • Run Glances: {DIM}uv run utilities/glances/run-glances.py{RESET}
    • Start building: {DIM}uv init my-project{RESET}
""")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    header("Claude Environment Bootstrap")
    print(f"  Repo: {REPO_ROOT}")
    print(f"  Target Python: {PYTHON_VERSION}")

    check_prerequisites()
    install_uv()
    ensure_path()
    install_python()
    install_ruff()
    run_utility_setup_scripts()
    print_summary()


if __name__ == "__main__":
    main()
