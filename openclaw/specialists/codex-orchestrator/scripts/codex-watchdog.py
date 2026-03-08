#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from codex_lane_lib import read_run


def collect_runs(runs_dir: Path, stale_minutes: int) -> list[dict]:
    runs = []
    if not runs_dir.exists():
        return runs
    for child in sorted(runs_dir.iterdir()):
        if not child.is_dir() or child.name == "batches":
            continue
        if not (child / "manifest.json").exists():
            continue
        runs.append(read_run(child, stale_minutes=stale_minutes))
    return runs


def render(runs: list[dict], stale_minutes: int, alerts_only: bool) -> str:
    lines = [
        f"Codex watchdog (stale >= {stale_minutes}m)",
        "STATE      MODE   AGE      TASK                 LANE                 REPO                 NOTE",
        "---------  -----  -------  -------------------  -------------------  -------------------  ------------------------------",
    ]
    shown = 0
    for run in runs:
        alert = run.get("stale") or run.get("state") in {"failed", "blocked"}
        if alerts_only and not alert:
            continue
        state = "stale" if run.get("stale") else run.get("state", "?")
        mode = (run.get("mode") or "exec")[:5].ljust(5)
        age = (run.get("stdoutAge") or "-")[:7].ljust(7)
        task = (run.get("stateTaskId") or "-")[:19].ljust(19)
        lane = (run.get("lane") or "-")[:19].ljust(19)
        repo = (Path(run.get("repo", "-")).name if run.get("repo") else "-")[:19].ljust(19)
        note = (run.get("lastNonEmptyLine") or "-")[:30]
        lines.append(f"{state:<9}  {mode}  {age}  {task}  {lane}  {repo}  {note}")
        shown += 1
    if shown == 0:
        lines.append("ok         -      -        -                    -                    no alerting lanes")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan tracked Codex lanes for stale/failed work")
    parser.add_argument("runs_dir", nargs="?", default="/Users/sawyer/.openclaw/workspace-codex-orchestrator/runs")
    parser.add_argument("--stale-minutes", type=int, default=30)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--alerts-only", action="store_true")
    parser.add_argument("--fail-on-alert", action="store_true")
    args = parser.parse_args()

    runs = collect_runs(Path(args.runs_dir).expanduser(), stale_minutes=args.stale_minutes)
    alerts = [r for r in runs if r.get("stale") or r.get("state") in {"failed", "blocked"}]

    if args.json:
        print(json.dumps({"runs": runs, "alerts": alerts, "staleMinutes": args.stale_minutes}, indent=2))
    else:
        print(render(runs, args.stale_minutes, alerts_only=args.alerts_only))

    return 1 if args.fail_on_alert and alerts else 0


if __name__ == "__main__":
    raise SystemExit(main())
