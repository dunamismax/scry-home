# PROJECT_REGISTRY

Canonical machine-readable registry: `coordination/PROJECT_REGISTRY.yaml`

Use that YAML file as the source of truth for active stateful PM projects and reusable project lanes.

Quick commands:

```bash
python3 scripts/codex-state.py registry-list
python3 scripts/codex-state.py registry-upsert --project-id <id> --label <label> --state-file <path>
```
