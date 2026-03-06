"""Reconcile managed cron jobs against a single-source manifest.

Default: dry-run (report only). Pass --apply to write changes.
Pass --scope=smoke to reconcile only specialist smoke jobs (default).
Pass --scope=all to reconcile ALL managed jobs in the manifest.

Usage:
  uv run python -m scripts cron:reconcile               # dry-run
  uv run python -m scripts cron:reconcile --apply        # apply changes
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from scripts.common import log_step, run_or_throw

HOME = str(Path.home())
WS = str(Path.home() / ".openclaw")


# ---------------------------------------------------------------------------
# Manifest helpers
# ---------------------------------------------------------------------------


def _display_name(agent_id: str) -> str:
    if agent_id == "builder-mobile":
        return "Builder Mobile"
    if agent_id == "openclaw-maintainer":
        return "OpenClaw Maintainer"
    return agent_id[0].upper() + agent_id[1:]


def _specialist_smoke_payload(agent_id: str, dn: str) -> str:
    is_maintainer = agent_id == "openclaw-maintainer"
    script_path = (
        f"{WS}/workspace-openclaw-maintainer/scripts/openclaw-maintainer-weekly-smoke.sh"
        if is_maintainer
        else f"{WS}/workspace-{agent_id}/scripts/specialist-weekly-smoke.sh"
    )

    title = (
        "Run the OpenClaw Maintainer weekly scored smoke test and report results."
        if is_maintainer
        else f"Run {dn} weekly specialist smoke test."
    )

    fail_msg = (
        "Reminder: weekly OpenClaw maintainer smoke failed. Review hook wiring, triage protocol, verification gates, and attribution compliance."
        if is_maintainer
        else f"Reminder: {dn} weekly smoke failed. Review protocol, verification discipline, and attribution guardrails."
    )

    return "\n".join(
        [
            title,
            "",
            "Execute exactly:",
            "set -euo pipefail",
            f'OUT="$({script_path} 2>&1)" || RC=$?',
            "RC=${RC:-0}",
            "printf '%s\\n' \"$OUT\"",
            'if [ "$RC" -ne 0 ]; then',
            f'  openclaw system event --text "{fail_msg}" --mode now',
            "  exit 1",
            "fi",
            "exit 0",
        ]
    )


SPECIALIST_SCHEDULE = [
    {"id": "codex-orchestrator", "minute": 2, "hour": 10},
    {"id": "sentinel", "minute": 4, "hour": 10},
    {"id": "reviewer", "minute": 16, "hour": 10},
    {"id": "builder-mobile", "minute": 18, "hour": 10},
    {"id": "openclaw-maintainer", "minute": 32, "hour": 9},
    {"id": "contributor", "minute": 34, "hour": 9},
    {"id": "luma", "minute": 36, "hour": 9},
]


def _build_manifest() -> list[dict]:
    jobs: list[dict] = []

    # Agent-bench-wide weekly smoke
    jobs.append(
        {
            "name": "healthcheck:agent-bench-weekly-smoke",
            "scope": "system",
            "schedule": {
                "kind": "cron",
                "expr": "20 9 * * 1",
                "tz": "America/New_York",
            },
            "sessionTarget": "isolated",
            "payload": {
                "kind": "agentTurn",
                "model": "openai-codex/gpt-5.4",
                "thinking": "low",
                "timeoutSeconds": 1800,
                "message": (
                    "Run the weekly specialist-agent bench smoke test. This is a deterministic health + recency check — not a deep optimization review.\n\n"
                    "## Agents to check\ncodex-orchestrator, sentinel, reviewer, builder-mobile, openclaw-maintainer, contributor, luma\n\n"
                    "## Required checks (deterministic, per agent)\n\n"
                    "1. **Config presence**: Run `openclaw config get agents.list` and verify each agent ID exists.\n"
                    "2. **Workspace files**: For each agent, check that these files exist in `~/.openclaw/workspace-<agentId>/`:\n"
                    "   - SOUL.md, AGENTS.md, IDENTITY.md\n"
                    "   - (CLAUDE.md is optional — note if missing but do not fail)\n"
                    "3. **Model policy compliance**: Verify each agent uses `openai-codex/gpt-5.4` as primary and `anthropic/claude-opus-4-6` as fallback.\n"
                    '4. **Recency check**: Run `openclaw cron runs --limit 50 --json 2>/dev/null` and `ls -lt ~/.openclaw/sessions/ 2>/dev/null | head -30` to assess recent agent activity. Flag any specialist with no session activity in the last 7 days as "dormant".\n'
                    '5. **Cron guard health**: Verify that `healthcheck:agent-bench-daily` exists and its lastRunStatus is "ok" (run `openclaw cron list --json`).\n\n'
                    "## Output format (concise, structured)\n\n"
                    '```\n## Weekly Bench Smoke Test — <date>\n\n### Pass/Fail Summary\n| Agent | Config | Files | Model | Recency | Status |\n|-------|--------|-------|-------|---------|--------|\n| codex-orchestrator | ✅ | ✅ | ✅ | active | PASS |\n| ... | ... | ... | ... | ... | ... |\n\n### Recency & Risk Watchlist\n- <agent>: <risk note or "nominal">\n- ...\n\n### Cron Guard Status\n- healthcheck:agent-bench-daily: <status>\n\n### Overall: <PASS/FAIL> (<N>/<total> agents healthy)\n```\n\n'
                    "## Model policy (hard constraint)\nUse/recommend only: `openai-codex/gpt-5.4` (primary) and `anthropic/claude-opus-4-6` (fallback). Do not suggest downgrades.\n\n"
                    "If any check cannot complete, report partial results with exact blockers."
                ),
            },
            "delivery": {
                "mode": "announce",
                "channel": "signal",
                "to": "+19412897570",
                "bestEffort": True,
            },
            "enabled": True,
        }
    )

    # Per-specialist smoke jobs
    for spec in SPECIALIST_SCHEDULE:
        agent_id = spec["id"]
        dn = _display_name(agent_id)

        jobs.append(
            {
                "name": f"healthcheck:{agent_id}-weekly-smoke",
                "scope": "smoke",
                "schedule": {
                    "kind": "cron",
                    "expr": f"{spec['minute']} {spec['hour']} * * 1",
                    "tz": "America/New_York",
                },
                "sessionTarget": "isolated",
                "payload": {
                    "kind": "agentTurn",
                    "model": "openai-codex/gpt-5.4",
                    "thinking": "low",
                    "timeoutSeconds": 1800,
                    "message": _specialist_smoke_payload(agent_id, dn),
                },
                "delivery": {
                    "mode": "announce",
                    "channel": "signal",
                    "to": "+19412897570",
                    "bestEffort": True,
                },
                "enabled": True,
            }
        )

    return jobs


# ---------------------------------------------------------------------------
# Live state
# ---------------------------------------------------------------------------


def _load_live_jobs() -> list[dict]:
    raw = run_or_throw(["openclaw", "cron", "list", "--json"], quiet=True)
    parsed = json.loads(raw)
    if isinstance(parsed, list):
        return parsed
    return parsed.get("jobs", parsed.get("entries", []))


# ---------------------------------------------------------------------------
# Diff engine
# ---------------------------------------------------------------------------


def _normalize(v):
    if v is None:
        return v
    if isinstance(v, str):
        return re.sub(
            r"[ \t]+$", "", v.replace("\r\n", "\n"), flags=re.MULTILINE
        ).rstrip()
    if isinstance(v, list):
        return [_normalize(item) for item in v]
    if isinstance(v, dict):
        return {k: _normalize(val) for k, val in v.items() if k != "staggerMs"}
    return v


def _stable_json(v) -> str:
    return json.dumps(_normalize(v), sort_keys=True, ensure_ascii=False)


def _deep_equal(a, b) -> bool:
    return _stable_json(a) == _stable_json(b)


def _diff(manifest: list[dict], live: list[dict]) -> list[dict]:
    actions: list[dict] = []
    live_by_name = {j["name"]: j for j in live}
    managed_names = {j["name"] for j in manifest}

    for want in manifest:
        have = live_by_name.get(want["name"])
        if not have:
            actions.append({"kind": "create", "job": want})
            continue

        patches: dict = {}
        for field in ("schedule", "sessionTarget", "payload", "delivery", "enabled"):
            if not _deep_equal(have.get(field), want.get(field)):
                patches[field] = want[field]

        if patches:
            actions.append(
                {
                    "kind": "update",
                    "jobId": have["id"],
                    "name": want["name"],
                    "patches": patches,
                }
            )

    # Detect orphans
    for name, lj in live_by_name.items():
        if name not in managed_names:
            is_specialist_smoke = (
                name.startswith("healthcheck:")
                and name.endswith("-weekly-smoke")
                and name != "healthcheck:agent-bench-weekly-smoke"
            )
            is_system_smoke = name == "healthcheck:agent-bench-weekly-smoke"

            should_flag = (
                any(m["scope"] == "smoke" for m in manifest) and is_specialist_smoke
            ) or (any(m["scope"] == "system" for m in manifest) and is_system_smoke)

            if should_flag:
                actions.append({"kind": "remove", "jobId": lj["id"], "name": name})

    return actions


# ---------------------------------------------------------------------------
# Apply
# ---------------------------------------------------------------------------


def _apply_create(job: dict) -> None:
    args = [
        "openclaw",
        "cron",
        "add",
        "--name",
        job["name"],
        "--session",
        job["sessionTarget"],
    ]

    schedule = job["schedule"]
    if schedule["kind"] == "cron":
        args.extend(["--cron", schedule["expr"], "--tz", schedule["tz"]])

    payload = job["payload"]
    if payload["kind"] == "agentTurn":
        args.extend(["--message", payload["message"]])
        if payload.get("model"):
            args.extend(["--model", payload["model"]])
        if payload.get("thinking"):
            args.extend(["--thinking", payload["thinking"]])
        if payload.get("timeoutSeconds"):
            args.extend(["--timeout-seconds", str(payload["timeoutSeconds"])])
    else:
        args.extend(["--system-event", payload["message"]])

    delivery = job.get("delivery", {})
    if delivery.get("mode") == "announce":
        args.append("--announce")
        if delivery.get("channel"):
            args.extend(["--channel", delivery["channel"]])
        if delivery.get("to"):
            args.extend(["--to", delivery["to"]])
        if delivery.get("bestEffort"):
            args.append("--best-effort-deliver")

    if not job.get("enabled", True):
        args.append("--disable")

    run_or_throw(args)


def _apply_update(job_id: str, patches: dict) -> None:
    args = ["openclaw", "cron", "edit", job_id]

    if "schedule" in patches:
        s = patches["schedule"]
        if s["kind"] == "cron":
            args.extend(["--cron", s["expr"], "--tz", s["tz"]])

    if "sessionTarget" in patches:
        args.extend(["--session", patches["sessionTarget"]])

    if "payload" in patches:
        p = patches["payload"]
        if p["kind"] == "agentTurn":
            args.extend(["--message", p["message"]])
            if p.get("model"):
                args.extend(["--model", p["model"]])
            if p.get("thinking"):
                args.extend(["--thinking", p["thinking"]])
            if p.get("timeoutSeconds"):
                args.extend(["--timeout-seconds", str(p["timeoutSeconds"])])
        else:
            args.extend(["--system-event", p["message"]])

    if "delivery" in patches:
        d = patches["delivery"]
        if d.get("mode") == "announce":
            args.append("--announce")
            if d.get("channel"):
                args.extend(["--channel", d["channel"]])
            if d.get("to"):
                args.extend(["--to", d["to"]])
            if d.get("bestEffort"):
                args.append("--best-effort-deliver")
        else:
            args.append("--no-deliver")

    if patches.get("enabled") is True:
        args.append("--enable")
    if patches.get("enabled") is False:
        args.append("--disable")

    run_or_throw(args)


def _apply_actions(actions: list[dict]) -> None:
    for a in actions:
        if a["kind"] == "create":
            _apply_create(a["job"])
            print(f"  [CREATED] {a['job']['name']}")
        elif a["kind"] == "update":
            _apply_update(a["jobId"], a["patches"])
            print(f"  [UPDATED] {a['name']} ({', '.join(a['patches'].keys())})")
        elif a["kind"] == "remove":
            run_or_throw(["openclaw", "cron", "rm", a["jobId"]])
            print(f"  [REMOVED] {a['name']}")


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------


def reconcile_cron() -> None:
    apply = "--apply" in sys.argv
    scope_arg = next((a for a in sys.argv if a.startswith("--scope=")), None)
    scope = scope_arg.split("=")[1] if scope_arg else "smoke"

    log_step("Loading cron manifest")
    manifest = _build_manifest()

    if scope == "smoke":
        manifest = [j for j in manifest if j["scope"] == "smoke"]
        print(f"  scope: smoke ({len(manifest)} specialist smoke jobs)")
    else:
        print(f"  scope: all ({len(manifest)} managed jobs)")

    log_step("Loading live cron state")
    live = _load_live_jobs()
    print(f"  live jobs total: {len(live)}")

    log_step("Computing diff")
    actions = _diff(manifest, live)

    if not actions:
        print("  ✅ No drift detected — manifest and live state match.")
        return

    print(f"  {len(actions)} action(s) needed:")
    for a in actions:
        if a["kind"] == "create":
            print(f"    + CREATE {a['job']['name']}")
        elif a["kind"] == "update":
            print(f"    ~ UPDATE {a['name']} ({', '.join(a['patches'].keys())})")
        elif a["kind"] == "remove":
            print(f"    - REMOVE {a['name']}")

    if not apply:
        print("\n  Dry run. Pass --apply to converge live state.")
        return

    log_step("Applying changes")
    _apply_actions(actions)

    log_step("Reconciliation complete")


if __name__ == "__main__":
    reconcile_cron()
