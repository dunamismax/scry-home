#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

TOKEN_KEYS = {
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "prompt_tokens",
    "completion_tokens",
    "tokens",
    "tokens_used",
}


def load_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def load_latest_jsonl(path: Path) -> dict[str, Any] | None:
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except FileNotFoundError:
        return None
    for raw in reversed(lines):
        line = raw.strip()
        if not line:
            continue
        try:
            value = json.loads(line)
        except Exception:
            continue
        if isinstance(value, dict):
            return value
    return None


def iter_token_values(obj: Any):
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key in TOKEN_KEYS and isinstance(value, int):
                yield key, value
            yield from iter_token_values(value)
    elif isinstance(obj, list):
        for item in obj:
            yield from iter_token_values(item)


def summarize_log(stdout_log: Path) -> dict[str, Any]:
    summary: dict[str, Any] = {
        "events": 0,
        "jsonEvents": 0,
        "lastEventType": None,
        "tokenSignals": {},
        "lastNonEmptyLine": None,
    }
    token_signals: dict[str, int] = {}
    token_regex = re.compile(r"tokens? used\s*[:=]?\s*(\d+)", re.I)

    try:
        lines = stdout_log.read_text(encoding="utf-8", errors="replace").splitlines()
    except FileNotFoundError:
        return summary

    for raw in lines:
        line = raw.strip()
        if not line:
            continue
        summary["events"] += 1
        summary["lastNonEmptyLine"] = line[:400]
        try:
            event = json.loads(line)
        except Exception:
            match = token_regex.search(line)
            if match:
                token_signals["tokens_used"] = int(match.group(1))
            continue

        summary["jsonEvents"] += 1
        evt_type = event.get("type") or event.get("event")
        if isinstance(evt_type, str):
            summary["lastEventType"] = evt_type
        for key, value in iter_token_values(event):
            token_signals[key] = max(token_signals.get(key, 0), value)

    summary["tokenSignals"] = dict(sorted(token_signals.items()))
    return summary


def age_string(path: Path) -> str:
    ts = path.stat().st_mtime
    delta = datetime.now(timezone.utc) - datetime.fromtimestamp(ts, tz=timezone.utc)
    seconds = int(delta.total_seconds())
    if seconds < 60:
        return f"{seconds}s"
    minutes, seconds = divmod(seconds, 60)
    if minutes < 60:
        return f"{minutes}m{seconds:02d}s"
    hours, minutes = divmod(minutes, 60)
    return f"{hours}h{minutes:02d}m"


def age_minutes(path: Path) -> float:
    ts = path.stat().st_mtime
    delta = datetime.now(timezone.utc) - datetime.fromtimestamp(ts, tz=timezone.utc)
    return delta.total_seconds() / 60.0


def best_token_count(token_signals: dict[str, int]) -> int | None:
    for key in ("total_tokens", "tokens", "tokens_used", "input_tokens", "prompt_tokens"):
        value = token_signals.get(key)
        if isinstance(value, int):
            return value
    return None


def classify_health(token_signals: dict[str, int]) -> str | None:
    used = best_token_count(token_signals)
    if used is None:
        return None
    if used > 220_000:
        return "critical"
    if used >= 150_000:
        return "warning"
    return "healthy"


def _snapshot_token_signals(snapshot: dict[str, Any] | None) -> dict[str, int]:
    if not snapshot:
        return {}
    explicit = snapshot.get("tokenSignals")
    if isinstance(explicit, dict):
        return {k: v for k, v in explicit.items() if isinstance(v, int)}
    tokens = snapshot.get("tokens")
    if isinstance(tokens, int):
        return {"total_tokens": tokens}
    return {}


def read_run(run_dir: Path, stale_minutes: int = 30) -> dict[str, Any]:
    manifest = load_json(run_dir / "manifest.json") or {}
    mode = manifest.get("mode", "exec")
    exit_path = run_dir / "exit-code.txt"
    exit_code = exit_path.read_text(encoding="utf-8").strip() if exit_path.exists() else "running"

    stdout_log = run_dir / "stdout.log"
    health_log = run_dir / "health.jsonl"
    latest_snapshot = load_latest_jsonl(health_log)

    summary = summarize_log(stdout_log)
    token_signals = summary.get("tokenSignals", {})
    last_event_type = summary.get("lastEventType")
    last_line = summary.get("lastNonEmptyLine")
    signal_path = stdout_log if stdout_log.exists() else None

    if mode == "pty" and latest_snapshot:
        token_signals = _snapshot_token_signals(latest_snapshot)
        last_event_type = latest_snapshot.get("event", "snapshot")
        last_line = latest_snapshot.get("note") or latest_snapshot.get("changes") or latest_snapshot.get("status")
        signal_path = health_log if health_log.exists() else signal_path

    signal_age = age_string(signal_path) if signal_path and signal_path.exists() else None
    signal_age_min = age_minutes(signal_path) if signal_path and signal_path.exists() else None

    state = "running"
    if mode == "pty" and latest_snapshot and isinstance(latest_snapshot.get("status"), str):
        state = latest_snapshot["status"]
    elif exit_code != "running":
        state = "completed" if exit_code == "0" else "failed"

    stale = state == "running" and signal_age_min is not None and signal_age_min >= stale_minutes
    health = latest_snapshot.get("context") if mode == "pty" and latest_snapshot else classify_health(token_signals)

    return {
        "runDir": str(run_dir),
        "mode": mode,
        "sessionId": manifest.get("sessionId"),
        "batchDir": manifest.get("batchDir"),
        "stateFile": manifest.get("stateFile"),
        "stateTaskId": manifest.get("stateTaskId"),
        "stateOwner": manifest.get("stateOwner"),
        "lane": manifest.get("lane"),
        "repo": manifest.get("repo"),
        "repoBranch": manifest.get("repoBranch"),
        "repoHead": manifest.get("repoHead"),
        "repoDirty": manifest.get("repoDirty"),
        "reasoning": manifest.get("reasoning"),
        "sandbox": manifest.get("sandbox"),
        "createdAt": manifest.get("createdAt"),
        "completedAt": manifest.get("completedAt"),
        "promptSha256": manifest.get("promptSha256"),
        "promptBytes": manifest.get("promptBytes"),
        "exitCode": exit_code,
        "state": state,
        "stale": stale,
        "stdoutAge": signal_age,
        "stdoutAgeMinutes": None if signal_age_min is None else round(signal_age_min, 1),
        "stdoutBytes": stdout_log.stat().st_size if stdout_log.exists() else 0,
        "events": summary.get("events"),
        "jsonEvents": summary.get("jsonEvents"),
        "lastEventType": last_event_type,
        "tokenSignals": token_signals,
        "tokenCount": best_token_count(token_signals),
        "health": health,
        "lastNonEmptyLine": last_line,
        "latestSnapshot": latest_snapshot,
    }
