# CAB / Change Factory Workflow

This repo now carries the first runnable CAB slice for Stephen's repo work.

## Command Surface

Scaffold a dated CAB packet for any managed project in `scripts/projects_config.py`:

```bash
uv run python -m scripts cab:new --project=scry-home --packet=repo-control-plane-slice
```

Safe preview:

```bash
uv run python -m scripts cab:new --project=scry-home --packet=repo-control-plane-slice --dry-run
```

Default output lands in `artifacts/cab/`. Override with `--output=...` if you want the packet elsewhere.

## Operating Loop

1. Run `uv run python -m scripts projects:doctor` if you need a quick keeper-repo inventory check.
2. Scaffold a CAB packet for the active repo/workstream.
3. Start with `03-repo-dossier.md` so the packet captures current branch, remotes, install, and verify commands from the managed-project inventory.
4. Use `01-morning-brief.md` or `02-focus-sprint.md` to frame the current pass.
5. Put research directly into `09-research-memo.md` and `research/source-log.md`.
   Research Forge is folded into CAB artifacts here; it is not a separate product or folder tree.
6. When a decision matters, write `04-decision-memo.md`, then attack it with `06-adversarial-review.md`.
7. Use `07-build-vs-buy.md`, `08-architecture-review-packet.md`, or `05-kill-memo.md` only when the work actually needs that depth.
8. Close the loop with `10-weekly-review.md` when the packet spans multiple days or a full weekly cycle.

## Packet Contents

Every scaffolded packet includes:

- `README.md` — packet index and usage notes
- `01-morning-brief.md`
- `02-focus-sprint.md`
- `03-repo-dossier.md`
- `04-decision-memo.md`
- `05-kill-memo.md`
- `06-adversarial-review.md`
- `07-build-vs-buy.md`
- `08-architecture-review-packet.md`
- `09-research-memo.md`
- `10-weekly-review.md`
- `evidence/check-log.md`
- `research/source-log.md`

## Integration Points

- Project selection is limited to repos already tracked in `scripts/projects_config.py`.
- Repo dossier content is prefilled from the managed-project entry plus live git state.
- Verification guidance in each packet stays aligned with this repo's existing CLI commands instead of inventing a new control plane.
