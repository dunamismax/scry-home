"""Bootstrap scry-home: check prerequisites and sync the local Python env."""

from __future__ import annotations

from scripts.common import command_exists, log_step, run_or_throw

REQUIRED_TOOLS = ["git", "uv"]


def bootstrap() -> None:
    log_step("Checking prerequisites")
    for tool in REQUIRED_TOOLS:
        if not command_exists(tool):
            raise RuntimeError(f"Missing required tool: {tool}")
        print(f"ok: {tool}")

    log_step("Syncing local project environment")
    run_or_throw(["uv", "sync"])

    log_step("Bootstrap complete")
    uv_version = run_or_throw(["uv", "--version"], quiet=True)
    print(f"uv: {uv_version}")
    print("managed project installs remain explicit: uv run python -m scripts projects:install")
