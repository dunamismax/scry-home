#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

WORKSPACE = Path("/Users/sawyer/.openclaw/workspace-codex-orchestrator")
DEFAULT_REGISTRY = WORKSPACE / "coordination" / "PROJECT_REGISTRY.yaml"


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-")
    return slug or "project"


def _run_yq(args: list[str], input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(
        ["yq", *args],
        input=input_text,
        text=True,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit(proc.stderr.strip() or f"yq failed: {' '.join(args)}")
    return proc


def load_yaml(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return json.loads(json.dumps(default))
    proc = _run_yq(["-o=json", ".", str(path)])
    raw = proc.stdout.strip()
    if not raw:
        return json.loads(json.dumps(default))
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"failed to parse YAML as JSON: {path}: {exc}")
    if not isinstance(data, dict):
        raise SystemExit(f"expected a mapping at top level: {path}")
    return data


def save_yaml(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(data, indent=2)
    proc = _run_yq(["-P", "-p=json", "."], input_text=raw)
    path.write_text(proc.stdout, encoding="utf-8")


def ensure_registry(data: dict[str, Any]) -> dict[str, Any]:
    data.setdefault("registry", "codex-orchestrator")
    data.setdefault("updated", now_iso())
    projects = data.get("projects")
    if not isinstance(projects, list):
        data["projects"] = []
    return data


def ensure_state(
    data: dict[str, Any],
    *,
    project: str | None = None,
    project_id: str | None = None,
    objective: str | None = None,
    coordinator: str | None = None,
    status: str | None = None,
) -> dict[str, Any]:
    if project is not None:
        data["project"] = project
    data.setdefault("project", "unnamed-project")

    if project_id is not None:
        data["project_id"] = project_id
    data.setdefault("project_id", slugify(str(data["project"])))

    if objective is not None:
        data["objective"] = objective
    data.setdefault("objective", "")

    if coordinator is not None:
        data["coordinator"] = coordinator
    data.setdefault("coordinator", "codex-orchestrator")

    if status is not None:
        data["status"] = status
    data.setdefault("status", "planning")

    data["updated"] = now_iso()

    tasks = data.get("tasks")
    if not isinstance(tasks, list):
        data["tasks"] = []

    next_actions = data.get("next_actions")
    if not isinstance(next_actions, list):
        data["next_actions"] = []

    notes = data.get("notes")
    if not isinstance(notes, list):
        data["notes"] = []

    return data


def dedupe_keep_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        value = item.strip()
        if not value or value in seen:
            continue
        seen.add(value)
        out.append(value)
    return out


def merge_note(existing: Any, addition: str | None) -> str | None:
    existing_text = str(existing).strip() if isinstance(existing, str) else ""
    if not addition:
        return existing_text or None
    addition = addition.strip()
    if not existing_text:
        return addition
    if addition in existing_text:
        return existing_text
    return f"{existing_text} | {addition}"


def get_task(state: dict[str, Any], task_id: str) -> dict[str, Any] | None:
    for task in state.get("tasks", []):
        if isinstance(task, dict) and str(task.get("id")) == task_id:
            return task
    return None


def cmd_init(args: argparse.Namespace) -> int:
    path = Path(args.state_file).expanduser().resolve()
    state = load_yaml(path, default={})
    state = ensure_state(
        state,
        project=args.project,
        project_id=args.project_id,
        objective=args.objective,
        coordinator=args.coordinator,
        status=args.status,
    )
    if args.note:
        state["notes"] = dedupe_keep_order([*state.get("notes", []), *args.note])
    save_yaml(path, state)
    print(path)
    return 0


def cmd_registry_upsert(args: argparse.Namespace) -> int:
    path = Path(args.registry_file).expanduser().resolve()
    registry = ensure_registry(load_yaml(path, default={}))
    projects = registry.get("projects", [])

    record = {
        "id": args.project_id,
        "label": args.label or args.project_id,
        "owner": args.owner or "codex-orchestrator",
        "status": args.status,
        "state_file": str(Path(args.state_file).expanduser().resolve()),
        "summary": args.summary or "",
        "updated": now_iso(),
    }
    if args.session_key:
        record["session_key"] = args.session_key

    replaced = False
    for idx, project in enumerate(projects):
        if isinstance(project, dict) and str(project.get("id")) == args.project_id:
            merged = dict(project)
            merged.update(record)
            projects[idx] = merged
            replaced = True
            break
    if not replaced:
        projects.append(record)

    registry["projects"] = sorted(
        [p for p in projects if isinstance(p, dict)],
        key=lambda p: (str(p.get("status", "")) != "active", str(p.get("label", ""))),
    )
    registry["updated"] = now_iso()
    save_yaml(path, registry)
    print(path)
    return 0


def cmd_registry_list(args: argparse.Namespace) -> int:
    path = Path(args.registry_file).expanduser().resolve()
    registry = ensure_registry(load_yaml(path, default={}))
    print(f"Registry: {path}")
    print(f"Updated: {registry.get('updated', '-')}")
    projects = registry.get("projects", [])
    if not projects:
        print("- no registered projects")
        return 0
    for project in projects:
        if not isinstance(project, dict):
            continue
        print(
            f"- {project.get('id', '-')} | {project.get('status', '-')} | "
            f"owner={project.get('owner', '-')} | label={project.get('label', '-')} | "
            f"state={project.get('state_file', '-') }"
        )
    return 0


def cmd_task_upsert(args: argparse.Namespace) -> int:
    path = Path(args.state_file).expanduser().resolve()
    state = ensure_state(load_yaml(path, default={}))
    task = get_task(state, args.id)
    created = False
    if task is None:
        task = {
            "id": args.id,
            "title": args.title or args.id,
            "status": args.status or "todo",
            "owner": args.owner or "unassigned",
            "created": now_iso(),
        }
        state["tasks"].append(task)
        created = True

    if args.title is not None:
        task["title"] = args.title
    task.setdefault("title", args.id)

    if args.owner is not None:
        task["owner"] = args.owner
    task.setdefault("owner", "unassigned")

    if args.status is not None:
        task["status"] = args.status
    task.setdefault("status", "todo")

    if args.priority is not None:
        task["priority"] = args.priority
    elif created and "priority" not in task:
        task["priority"] = "normal"

    if args.repo is not None:
        task["repo"] = str(Path(args.repo).expanduser().resolve())

    if args.run_dir is not None:
        task["run_dir"] = str(Path(args.run_dir).expanduser().resolve())

    if args.output is not None:
        task["output"] = args.output

    if args.notes is not None:
        task["notes"] = args.notes

    for note in args.append_note or []:
        task["notes"] = merge_note(task.get("notes"), note)

    if args.clear_blocked_by:
        task.pop("blocked_by", None)
    elif args.blocked_by:
        task["blocked_by"] = dedupe_keep_order(list(args.blocked_by))

    if task.get("status") == "in_progress":
        task.setdefault("started", now_iso())
        task.pop("completed", None)
    elif task.get("status") in {"done", "failed"}:
        task.setdefault("started", now_iso())
        task["completed"] = now_iso()
    elif task.get("status") == "blocked":
        task.setdefault("started", now_iso())
        task.pop("completed", None)

    task["updated"] = now_iso()
    state["updated"] = now_iso()

    if args.next_action:
        state["next_actions"] = dedupe_keep_order([*state.get("next_actions", []), *args.next_action])

    save_yaml(path, state)
    print(path)
    return 0


def cmd_next_add(args: argparse.Namespace) -> int:
    path = Path(args.state_file).expanduser().resolve()
    state = ensure_state(load_yaml(path, default={}))
    state["next_actions"] = dedupe_keep_order([*state.get("next_actions", []), *args.action])
    state["updated"] = now_iso()
    save_yaml(path, state)
    print(path)
    return 0


def render_summary(path: Path, state: dict[str, Any]) -> str:
    lines = [
        f"State file: {path}",
        f"Project: {state.get('project', '-')}",
        f"Project id: {state.get('project_id', '-')}",
        f"Status: {state.get('status', '-')}",
        f"Coordinator: {state.get('coordinator', '-')}",
        f"Updated: {state.get('updated', '-')}",
    ]
    objective = state.get("objective")
    if objective:
        lines.append(f"Objective: {objective}")

    notes = state.get("notes") or []
    if notes:
        lines.append("Notes:")
        for note in notes:
            lines.append(f"- {note}")

    lines.append("Tasks:")
    tasks = state.get("tasks") or []
    if not tasks:
        lines.append("- none")
    else:
        for task in tasks:
            if not isinstance(task, dict):
                continue
            status = task.get("status", "?")
            owner = task.get("owner", "-")
            title = task.get("title") or task.get("id", "-")
            line = f"- {task.get('id', '-')} | {status} | owner={owner} | {title}"
            extras: list[str] = []
            if task.get("repo"):
                extras.append(f"repo={Path(str(task['repo'])).name}")
            if task.get("blocked_by"):
                blocked = task["blocked_by"]
                if isinstance(blocked, list):
                    extras.append("blocked_by=" + ",".join(str(x) for x in blocked))
                else:
                    extras.append(f"blocked_by={blocked}")
            if task.get("run_dir"):
                extras.append(f"run={task['run_dir']}")
            if task.get("output"):
                extras.append(f"output={task['output']}")
            if extras:
                line += " | " + " | ".join(extras)
            lines.append(line)
            if task.get("notes"):
                lines.append(f"  notes: {task['notes']}")

    lines.append("Next actions:")
    next_actions = state.get("next_actions") or []
    if not next_actions:
        lines.append("- none")
    else:
        for action in next_actions:
            lines.append(f"- {action}")

    return "\n".join(lines)


def cmd_summary(args: argparse.Namespace) -> int:
    path = Path(args.state_file).expanduser().resolve()
    state = ensure_state(load_yaml(path, default={}))
    print(render_summary(path, state))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage Codex shared STATE.yaml coordination files")
    sub = parser.add_subparsers(dest="command", required=True)

    init_p = sub.add_parser("init", help="create or refresh a STATE.yaml file")
    init_p.add_argument("state_file")
    init_p.add_argument("--project", required=True)
    init_p.add_argument("--project-id")
    init_p.add_argument("--objective", default="")
    init_p.add_argument("--status", default="planning")
    init_p.add_argument("--coordinator", default="codex-orchestrator")
    init_p.add_argument("--note", action="append")
    init_p.set_defaults(func=cmd_init)

    reg_upsert = sub.add_parser("registry-upsert", help="add or update a project in the registry")
    reg_upsert.add_argument("--registry-file", default=str(DEFAULT_REGISTRY))
    reg_upsert.add_argument("--project-id", required=True)
    reg_upsert.add_argument("--label")
    reg_upsert.add_argument("--state-file", required=True)
    reg_upsert.add_argument("--owner")
    reg_upsert.add_argument("--status", default="active")
    reg_upsert.add_argument("--summary", default="")
    reg_upsert.add_argument("--session-key")
    reg_upsert.set_defaults(func=cmd_registry_upsert)

    reg_list = sub.add_parser("registry-list", help="list registered projects")
    reg_list.add_argument("--registry-file", default=str(DEFAULT_REGISTRY))
    reg_list.set_defaults(func=cmd_registry_list)

    task_upsert = sub.add_parser("task-upsert", help="create or update a task in STATE.yaml")
    task_upsert.add_argument("state_file")
    task_upsert.add_argument("--id", required=True)
    task_upsert.add_argument("--title")
    task_upsert.add_argument("--owner")
    task_upsert.add_argument("--status")
    task_upsert.add_argument("--priority")
    task_upsert.add_argument("--repo")
    task_upsert.add_argument("--run-dir")
    task_upsert.add_argument("--output")
    task_upsert.add_argument("--notes")
    task_upsert.add_argument("--append-note", action="append")
    task_upsert.add_argument("--blocked-by", action="append")
    task_upsert.add_argument("--clear-blocked-by", action="store_true")
    task_upsert.add_argument("--next-action", action="append")
    task_upsert.set_defaults(func=cmd_task_upsert)

    next_add = sub.add_parser("next-add", help="append next_actions entries")
    next_add.add_argument("state_file")
    next_add.add_argument("action", nargs="+")
    next_add.set_defaults(func=cmd_next_add)

    summary_p = sub.add_parser("summary", help="render a readable summary")
    summary_p.add_argument("state_file")
    summary_p.set_defaults(func=cmd_summary)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
