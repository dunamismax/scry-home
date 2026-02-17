from __future__ import annotations

import shutil
from pathlib import Path

from scripts.lib import log_step, run_or_throw

REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_EXAMPLE = REPO_ROOT / "infra" / ".env.example"
ENV_PATH = REPO_ROOT / "infra" / ".env"


def _parse_env_keys(text: str) -> set[str]:
    keys: set[str] = set()
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        key = stripped.split("=", 1)[0].strip()
        if key:
            keys.add(key)
    return keys


def ensure_env_file() -> None:
    log_step("Ensuring infra env file")
    if not ENV_PATH.exists():
        shutil.copy2(ENV_EXAMPLE, ENV_PATH)
        print(f"created: {ENV_PATH}")
        return

    template = ENV_EXAMPLE.read_text()
    current = ENV_PATH.read_text()
    current_keys = _parse_env_keys(current)

    missing_lines: list[str] = []
    for line in template.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        key = stripped.split("=", 1)[0].strip()
        if key and key not in current_keys:
            missing_lines.append(stripped)

    if not missing_lines:
        print(f"exists: {ENV_PATH}")
        return

    updated = current.rstrip() + "\n\n" + "\n".join(missing_lines) + "\n"
    ENV_PATH.write_text(updated)
    print(f"updated: {ENV_PATH}")
    for line in missing_lines:
        print(f"added: {line.split('=', 1)[0]}")


def show_compose_hint() -> None:
    log_step("Infra ready")
    print("run: docker compose --env-file infra/.env -f infra/docker-compose.yml up -d")
    print("logs: docker compose --env-file infra/.env -f infra/docker-compose.yml logs -f")


def maybe_start_infra() -> None:
    import sys

    if "--up" in sys.argv:
        log_step("Starting infra services")
        run_or_throw(
            [
                "docker",
                "compose",
                "--env-file",
                str(REPO_ROOT / "infra" / ".env"),
                "-f",
                str(REPO_ROOT / "infra" / "docker-compose.yml"),
                "up",
                "-d",
            ]
        )


def main() -> None:
    ensure_env_file()
    maybe_start_infra()
    show_compose_hint()


if __name__ == "__main__":
    main()
