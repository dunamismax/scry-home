#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

from codex_lane_lib import read_run


def lane_sort_key(run: dict) -> tuple:
    state_order = {"running": 0, "failed": 1, "completed": 2}
    return (
        state_order.get(run.get("state"), 9),
        0 if run.get("stale") else 1,
        run.get("createdAt") or "",
    )


def repo_label(path: str | None) -> str:
    if not path:
        return "-"
    return Path(path).name or path


def render_table(runs: list[dict], stale_minutes: int) -> str:
    lines = [
        f"Codex lanes overview (stale >= {stale_minutes}m)",
        "STATE      AGE      HEALTH    TASK                 LANE                 REPO                 LAST",
        "---------  -------  --------  -------------------  -------------------  -------------------  ------------------------------",
    ]
    if not runs:
        lines.append("idle       -        -         -                    -                    no runs found")
        return "\n".join(lines)

    for run in runs:
        state = run.get("state", "?")
        if run.get("stale"):
            state = "stale"
        health = run.get("health") or "-"
        task = (run.get("stateTaskId") or "-")[:19].ljust(19)
        lane = (run.get("lane") or "-")[:19].ljust(19)
        repo = repo_label(run.get("repo"))[:19].ljust(19)
        last = (run.get("lastNonEmptyLine") or "-")[:30]
        age = (run.get("stdoutAge") or "-")[:7].ljust(7)
        lines.append(f"{state:<9}  {age}  {health:<8}  {task}  {lane}  {repo}  {last}")
    return "\n".join(lines)


def main() -> int:
    stale_minutes = 30
    json_mode = False
    args = sys.argv[1:]
    runs_dir = Path("/Users/sawyer/.openclaw/workspace-codex-orchestrator/runs")

    for arg in list(args):
        if arg == "--json":
            json_mode = True
            args.remove(arg)
        elif arg.startswith("--stale-minutes="):
            stale_minutes = int(arg.split("=", 1)[1])
            args.remove(arg)

    if args:
        runs_dir = Path(args[0]).expanduser()

    runs = []
    if runs_dir.exists():
        for child in runs_dir.iterdir():
            if not child.is_dir():
                continue
            if not (child / "manifest.json").exists():
                continue
            runs.append(read_run(child, stale_minutes=stale_minutes))
    runs.sort(key=lane_sort_key)

    if json_mode:
        print(json.dumps({"runs": runs, "staleMinutes": stale_minutes}, indent=2))
    else:
        print(render_table(runs, stale_minutes))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
