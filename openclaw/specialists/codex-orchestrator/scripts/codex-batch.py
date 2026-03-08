#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from codex_lane_lib import read_run

WORKSPACE = Path("/Users/sawyer/.openclaw/workspace-codex-orchestrator")
RUNS_ROOT = WORKSPACE / "runs"
BATCH_ROOT = RUNS_ROOT / "batches"
STATE_HELPER = WORKSPACE / "scripts" / "codex-state.py"
REGISTRY_FILE = WORKSPACE / "coordination" / "PROJECT_REGISTRY.yaml"


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


def state_helper(*args: str, capture_output: bool = False) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(
        ["python3", str(STATE_HELPER), *args],
        text=True,
        capture_output=capture_output,
        check=False,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.strip() if proc.stderr else ""
        stdout = proc.stdout.strip() if proc.stdout else ""
        detail = stderr or stdout or f"codex-state.py failed: {' '.join(args)}"
        raise SystemExit(detail)
    return proc


def cmd_init(args: argparse.Namespace) -> int:
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    slug = slugify(args.name)
    project_id = args.project_id or f"{ts}-{slug}"
    batch_dir = BATCH_ROOT / f"{ts}-{slug}"
    state_file = batch_dir / "STATE.yaml"
    manifest = {
        "batch": args.name,
        "projectId": project_id,
        "objective": args.objective,
        "repos": args.repos or [],
        "verification": args.verification,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "laneRunDirs": [],
        "notes": args.note or [],
        "stateFile": str(state_file),
        "registryFile": str(REGISTRY_FILE),
        "coordinator": args.coordinator,
    }
    save_manifest(batch_dir / "manifest.json", manifest)

    init_args = [
        "init",
        str(state_file),
        "--project",
        args.name,
        "--project-id",
        project_id,
        "--objective",
        args.objective,
        "--status",
        args.status,
        "--coordinator",
        args.coordinator,
    ]
    for note in args.note or []:
        init_args.extend(["--note", note])
    state_helper(*init_args)

    state_helper(
        "registry-upsert",
        "--registry-file",
        str(REGISTRY_FILE),
        "--project-id",
        project_id,
        "--label",
        args.name,
        "--state-file",
        str(state_file),
        "--owner",
        args.owner,
        "--status",
        "active",
        "--summary",
        args.objective,
    )

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

    state_file = manifest.get("stateFile")
    if state_file and args.task_id:
        helper_args = [
            "task-upsert",
            str(state_file),
            "--id",
            args.task_id,
            "--status",
            args.task_status,
            "--owner",
            args.task_owner,
            "--run-dir",
            str(Path(args.lane_run_dir[-1]).expanduser().resolve()),
            "--append-note",
            f"lane attached via codex-batch add at {now_iso()}",
        ]
        if args.task_title:
            helper_args.extend(["--title", args.task_title])
        state_helper(*helper_args)

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
        f"Project id: {manifest.get('projectId', '-')}",
        f"Objective: {manifest.get('objective') or '-'}",
        f"State file: {manifest.get('stateFile') or '-'}",
        f"Counts: running={counts['running']} completed={counts['completed']} failed={counts['failed']} stale={counts['stale']} missing={counts['missing']}",
    ]

    state_file = manifest.get("stateFile")
    if state_file:
        proc = state_helper("summary", str(state_file), capture_output=True)
        lines.extend(["", "STATE", "-----", proc.stdout.strip()])

    lines.extend(
        [
            "",
            "LANES",
            "-----",
            "STATE      HEALTH    TASK                 LANE                 REPO                 NOTE",
            "---------  --------  -------------------  -------------------  -------------------  ------------------------------",
        ]
    )
    runs = data["runs"]
    if not runs:
        lines.append("idle       -         -                    -                    -                    no lanes attached")
        return "\n".join(lines)

    for run in runs:
        state = "stale" if run.get("stale") else run.get("state", "?")
        health = (run.get("health") or "-")[:8].ljust(8)
        task = (run.get("stateTaskId") or "-")[:19].ljust(19)
        lane = (run.get("lane") or "-")[:19].ljust(19)
        repo = (Path(run.get("repo", "-")).name if run.get("repo") else "-")[:19].ljust(19)
        note = (run.get("lastNonEmptyLine") or run.get("runDir") or "-")[:30]
        lines.append(f"{state:<9}  {health}  {task}  {lane}  {repo}  {note}")
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
    init_p.add_argument("--project-id")
    init_p.add_argument("--status", default="planning")
    init_p.add_argument("--coordinator", default="codex-orchestrator")
    init_p.add_argument("--owner", default="codex-orchestrator")
    init_p.set_defaults(func=cmd_init)

    add_p = sub.add_parser("add")
    add_p.add_argument("batch_dir")
    add_p.add_argument("lane_run_dir", nargs="+")
    add_p.add_argument("--task-id")
    add_p.add_argument("--task-title")
    add_p.add_argument("--task-owner", default="codex-lane")
    add_p.add_argument("--task-status", default="in_progress")
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
