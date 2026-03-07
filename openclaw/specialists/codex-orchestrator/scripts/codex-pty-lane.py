#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from codex_lane_lib import read_run

RUNS_ROOT = Path("/Users/sawyer/.openclaw/workspace-codex-orchestrator/runs")


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-")
    return slug or "lane"


def repo_meta(repo_dir: Path) -> dict[str, str]:
    import subprocess

    meta = {"repoToplevel": "", "repoBranch": "", "repoHead": "", "repoDirty": "unknown"}
    try:
        subprocess.run(["git", "-C", str(repo_dir), "rev-parse", "--show-toplevel"], check=True, capture_output=True, text=True)
    except Exception:
        return meta

    def cmd(*args: str) -> str:
        return subprocess.run(["git", "-C", str(repo_dir), *args], check=True, capture_output=True, text=True).stdout.strip()

    meta["repoToplevel"] = cmd("rev-parse", "--show-toplevel")
    meta["repoBranch"] = cmd("rev-parse", "--abbrev-ref", "HEAD")
    meta["repoHead"] = cmd("rev-parse", "HEAD")
    meta["repoDirty"] = "true" if cmd("status", "--short") else "false"
    return meta


def save_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def batch_attach(batch_dir: str | None, run_dir: Path) -> None:
    if not batch_dir:
        return
    manifest_path = Path(batch_dir).expanduser().resolve() / "manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception:
        return
    lane_dirs = manifest.get("laneRunDirs", [])
    run_str = str(run_dir.resolve())
    if run_str not in lane_dirs:
        lane_dirs.append(run_str)
        manifest["laneRunDirs"] = lane_dirs
        manifest["updatedAt"] = now_iso()
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def cmd_register(args: argparse.Namespace) -> int:
    repo_dir = Path(args.repo_dir).expanduser().resolve()
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_dir = RUNS_ROOT / f"{ts}-{slugify(args.lane_name)}"
    meta = repo_meta(repo_dir)
    manifest = {
        "lane": args.lane_name,
        "mode": "pty",
        "sessionId": args.session_id,
        "repo": str(repo_dir),
        **meta,
        "reasoning": args.reasoning,
        "sandbox": args.sandbox,
        "createdAt": now_iso(),
        "launcher": "scripts/codex-pty-lane.py register",
        "objective": args.objective,
        "batchDir": str(Path(args.batch_dir).expanduser().resolve()) if args.batch_dir else None,
    }
    save_json(run_dir / "manifest.json", manifest)
    (run_dir / "health.jsonl").touch()
    batch_attach(args.batch_dir, run_dir)
    print(run_dir)
    return 0


def cmd_snapshot(args: argparse.Namespace) -> int:
    run_dir = Path(args.run_dir).expanduser().resolve()
    manifest_path = run_dir / "manifest.json"
    if not manifest_path.exists():
        raise SystemExit(f"missing manifest: {manifest_path}")
    snapshot = {
        "event": "health_snapshot",
        "timestamp": now_iso(),
        "status": args.status,
        "model": args.model,
        "tokens": args.tokens,
        "context": args.context,
        "changes": args.changes,
        "note": args.note,
        "tokenSignals": {"total_tokens": args.tokens} if args.tokens is not None else {},
    }
    with (run_dir / "health.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps(snapshot) + "\n")

    if args.status in {"completed", "failed"}:
        save_json(manifest_path, {**json.loads(manifest_path.read_text(encoding="utf-8")), "completedAt": now_iso()})
        (run_dir / "exit-code.txt").write_text("0\n" if args.status == "completed" else "1\n", encoding="utf-8")

    print(json.dumps(snapshot, indent=2))
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    data = read_run(Path(args.run_dir).expanduser().resolve(), stale_minutes=args.stale_minutes)
    print(json.dumps(data, indent=2) if args.json else f"{data['lane']} | state={data['state']} stale={data['stale']} health={data.get('health') or '-'} tokens={data.get('tokenCount') or '-'} session={data.get('sessionId') or '-'}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Track PTY Codex lanes with structured health snapshots")
    sub = parser.add_subparsers(dest="command", required=True)

    reg = sub.add_parser("register")
    reg.add_argument("lane_name")
    reg.add_argument("repo_dir")
    reg.add_argument("session_id")
    reg.add_argument("--objective", default="")
    reg.add_argument("--batch-dir")
    reg.add_argument("--reasoning", default="high")
    reg.add_argument("--sandbox", default="workspace-write")
    reg.set_defaults(func=cmd_register)

    snap = sub.add_parser("snapshot")
    snap.add_argument("run_dir")
    snap.add_argument("--status", default="running", choices=["running", "completed", "failed", "blocked"])
    snap.add_argument("--model", default="gpt-5.4")
    snap.add_argument("--tokens", type=int)
    snap.add_argument("--context", default="healthy")
    snap.add_argument("--changes", default="")
    snap.add_argument("--note", default="")
    snap.set_defaults(func=cmd_snapshot)

    stat = sub.add_parser("status")
    stat.add_argument("run_dir")
    stat.add_argument("--stale-minutes", type=int, default=30)
    stat.add_argument("--json", action="store_true")
    stat.set_defaults(func=cmd_status)

    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
