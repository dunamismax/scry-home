#!/usr/bin/env python3
"""CLI dispatcher for grimoire scripts.

Usage:
  python3 -m scripts <command> [flags]
  python3 scripts/cli.py <command> [flags]
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure repo root is on sys.path for package imports
_repo_root = str(Path(__file__).resolve().parent.parent)
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

from scripts.tasks.bootstrap import bootstrap  # noqa: E402
from scripts.tasks.doctor import doctor  # noqa: E402
from scripts.tasks.harden_specialists import harden_specialists  # noqa: E402
from scripts.tasks.projects import (
    doctor_projects,
    install_projects,
    list_projects,
    verify_projects,
)  # noqa: E402
from scripts.tasks.reconcile_cron import reconcile_cron  # noqa: E402
from scripts.tasks.setup_config_backup import setup_config_backup  # noqa: E402
from scripts.tasks.setup_ssh import setup_ssh_backup, setup_ssh_restore  # noqa: E402
from scripts.tasks.setup_workstation import setup_workstation  # noqa: E402
from scripts.tasks.sync_openclaw import sync_openclaw  # noqa: E402
from scripts.tasks.sync_remotes import sync_remotes  # noqa: E402
from scripts.tasks.sync_work_desktop import sync_work_desktop  # noqa: E402
from scripts.tasks.verify_config_backup import verify_config_backup  # noqa: E402

COMMANDS: dict[str, dict] = {
    "bootstrap": {"fn": bootstrap},
    "doctor": {"fn": doctor},
    "setup:workstation": {"fn": setup_workstation},
    "setup:config_backup": {"fn": setup_config_backup},
    "verify:config_backup": {"fn": verify_config_backup},
    "setup:ssh_backup": {"fn": setup_ssh_backup},
    "setup:ssh_restore": {"fn": setup_ssh_restore},
    "projects:list": {"fn": list_projects},
    "projects:doctor": {"fn": doctor_projects},
    "projects:install": {"fn": install_projects},
    "projects:verify": {"fn": verify_projects},
    "sync:openclaw": {
        "fn": sync_openclaw,
        "flags": "--commit  sync + git commit + push",
    },
    "specialists:harden": {
        "fn": harden_specialists,
        "flags": "--discover | --agents=a,b | --include-maintainer  choose target specialist workspaces",
    },
    "cron:reconcile": {
        "fn": reconcile_cron,
        "flags": "--apply  converge live state | --scope=smoke|all  filter job scope",
    },
    "sync:remotes": {
        "fn": sync_remotes,
        "flags": "--fix     apply remote changes (default: dry run)",
    },
    "sync:work-desktop": {
        "fn": sync_work_desktop,
        "flags": "--dry-run preview only, no writes",
    },
}


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else None

    if not command or command not in COMMANDS:
        print(f"Unknown or missing command: {command or '(none)'}", file=sys.stderr)
        print("Available commands:", file=sys.stderr)
        for key, cmd in COMMANDS.items():
            flags = cmd.get("flags", "")
            suffix = f"  [{flags.split()[0]}]" if flags else ""
            print(f"  {key}{suffix}", file=sys.stderr)
        sys.exit(1)

    if "--help" in sys.argv:
        cmd = COMMANDS[command]
        print(f"Usage: python3 -m scripts {command}")
        if cmd.get("flags"):
            print(f"\nFlags:\n  {cmd['flags']}")
        sys.exit(0)

    try:
        COMMANDS[command]["fn"]()
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
