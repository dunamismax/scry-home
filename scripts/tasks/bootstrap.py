"""Bootstrap grimoire: check prerequisites, install deps."""

from __future__ import annotations

from scripts.common import command_exists, log_step, run_or_throw

REQUIRED_TOOLS = ["bun", "git", "curl"]


def bootstrap() -> None:
    log_step("Checking prerequisites")
    for tool in REQUIRED_TOOLS:
        if not command_exists(tool):
            raise RuntimeError(f"Missing required tool: {tool}")
        print(f"ok: {tool}")

    log_step("Installing dependencies with Bun")
    run_or_throw(["bun", "install"])

    log_step("Installing managed project dependencies")
    run_or_throw(["python3", "-m", "scripts", "projects:install"])

    log_step("Bootstrap complete")
    bun_version = run_or_throw(["bun", "--version"], quiet=True)
    print(f"bun: {bun_version}")
