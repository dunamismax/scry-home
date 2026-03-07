#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from codex_lane_lib import read_run

RUNS_ROOT = Path("/Users/sawyer/.openclaw/workspace-codex-orchestrator/runs")
BATCH_ROOT = RUNS_ROOT / "batches"


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-")
    return slug or "batch"


def load_manifest(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise SystemExit(f"failed to read batch manifest: {path}: {exc}")


def save_manifest(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def cmd_init(args: argparse.Namespace) -> int:
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    batch_dir = BATCH_ROOT / f"{ts}-{slugify(args.name)}"
    manifest = {
        "batch": args.name,
        "objective": args.objective,
        "repos": args.repos or [],
        "verification": args.verification,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "laneRunDirs": [],
        "notes": args.note or [],
    }
    save_manifest(batch_dir / "manifest.json", manifest)
    print(batch_dir)
    return 0


def cmd_add(args: argparse.Namespace) -> int:
    batch_dir = Path(args.batch_dir).expanduser().resolve()
    manifest_path = batch_dir / "manifest.json"
    manifest = load_manifest(manifest_path)
    lane_dirs = [str(Path(p).expanduser().resolve()) for p in manifest.get("laneRunDirs", [])]

    for lane in args.lane_run_dir:
        lane_dir = str(Path(lane).expanduser().resolve())
        if lane_dir not in lane_dirs:
            lane_dirs.append(lane_dir)

    manifest["laneRunDirs"] = lane_dirs
    manifest["updatedAt"] = now_iso()
    save_manifest(manifest_path, manifest)
    print(json.dumps({"batchDir": str(batch_dir), "laneRunDirs": lane_dirs}, indent=2))
    return 0


def summarize_batch(batch_dir: Path, stale_minutes: int) -> dict[str, Any]:
    manifest_path = batch_dir / "manifest.json"
    manifest = load_manifest(manifest_path)
    runs = []
    for lane_dir in manifest.get("laneRunDirs", []):
        path = Path(lane_dir)
        if path.exists():
            runs.append(read_run(path, stale_minutes=stale_minutes))
        else:
            runs.append({"runDir": lane_dir, "state": "missing", "stale": False})

    counts = {
        "running": sum(1 for r in runs if r.get("state") == "running"),
        "completed": sum(1 for r in runs if r.get("state") == "completed"),
        "failed": sum(1 for r in runs if r.get("state") == "failed"),
        "missing": sum(1 for r in runs if r.get("state") == "missing"),
        "stale": sum(1 for r in runs if r.get("stale")),
    }
    return {
        "batchDir": str(batch_dir),
        "manifest": manifest,
        "counts": counts,
        "runs": runs,
        "staleMinutes": stale_minutes,
    }


def render_status(data: dict[str, Any]) -> str:
    manifest = data["manifest"]
    counts = data["counts"]
    lines = [
        f"Codex batch | {manifest.get('batch', '-')}",
        f"Objective: {manifest.get('objective') or '-'}",
        f"Counts: running={counts['running']} completed={counts['completed']} failed={counts['failed']} stale={counts['stale']} missing={counts['missing']}",
        "",
        "STATE      HEALTH    LANE                 REPO                 NOTE",
        "---------  --------  -------------------  -------------------  ------------------------------",
    ]
    runs = data["runs"]
    if not runs:
        lines.append("idle       -         -                    -                    no lanes attached")
        return "\n".join(lines)

    for run in runs:
        state = "stale" if run.get("stale") else run.get("state", "?")
        health = (run.get("health") or "-")[:8].ljust(8)
        lane = (run.get("lane") or "-")[:19].ljust(19)
        repo = (Path(run.get("repo", "-")).name if run.get("repo") else "-")[:19].ljust(19)
        note = (run.get("lastNonEmptyLine") or run.get("runDir") or "-")[:30]
        lines.append(f"{state:<9}  {health}  {lane}  {repo}  {note}")
    return "\n".join(lines)


def cmd_status(args: argparse.Namespace) -> int:
    data = summarize_batch(Path(args.batch_dir).expanduser().resolve(), stale_minutes=args.stale_minutes)
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print(render_status(data))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Manage Codex swarm batch manifests")
    sub = parser.add_subparsers(dest="command", required=True)

    init_p = sub.add_parser("init")
    init_p.add_argument("name")
    init_p.add_argument("--objective", default="")
    init_p.add_argument("--verification", default="")
    init_p.add_argument("--repos", nargs="*", default=[])
    init_p.add_argument("--note", action="append")
    init_p.set_defaults(func=cmd_init)

    add_p = sub.add_parser("add")
    add_p.add_argument("batch_dir")
    add_p.add_argument("lane_run_dir", nargs="+")
    add_p.set_defaults(func=cmd_add)

    status_p = sub.add_parser("status")
    status_p.add_argument("batch_dir")
    status_p.add_argument("--stale-minutes", type=int, default=30)
    status_p.add_argument("--json", action="store_true")
    status_p.set_defaults(func=cmd_status)

    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
