from __future__ import annotations

from pathlib import Path

from scripts.lib import command_exists, log_step, run_or_throw

REPO_ROOT = Path(__file__).resolve().parent.parent
REQUIRED_TOOLS = ["python3", "uv", "docker", "git", "curl"]


def check_prereqs() -> None:
    log_step("Checking prerequisites")
    for tool in REQUIRED_TOOLS:
        if not command_exists(tool):
            raise RuntimeError(f"Missing required tool: {tool}")
        print(f"ok: {tool}")


def ensure_deps() -> None:
    log_step("Installing root dependencies")
    run_or_throw(["uv", "sync"], cwd=str(REPO_ROOT))


def ensure_managed_project_deps() -> None:
    log_step("Installing managed project dependencies")
    run_or_throw(["uv", "run", "scry-projects-install"], cwd=str(REPO_ROOT))


def setup_infra() -> None:
    log_step("Configuring PostgreSQL defaults")
    run_or_throw(["uv", "run", "scry-setup-storage"], cwd=str(REPO_ROOT))


def print_summary() -> None:
    log_step("Bootstrap complete")
    py_version = run_or_throw(["python3", "--version"], quiet=True)
    uv_version = run_or_throw(["uv", "--version"], quiet=True)
    print(f"python: {py_version}")
    print(f"uv: {uv_version}")
    print("next: uv run infra:up  (or: docker compose -f infra/docker-compose.yml up -d)")


def main() -> None:
    check_prereqs()
    ensure_deps()
    ensure_managed_project_deps()
    setup_infra()
    print_summary()


if __name__ == "__main__":
    main()
