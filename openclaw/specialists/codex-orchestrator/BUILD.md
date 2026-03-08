# BUILD.md

Status: in progress — the four new game-dev repos have been created, scaffolded, committed, and pushed, and the `dunamismax` profile README has been rewritten/pushed for the C#/game-dev pivot. Per the latest user instruction, local Rust repos are intentionally untouched for now.

## Phase plan
- [x] Inspect current lane headroom and GitHub auth
- [x] Initialize a tracked shared-state project for the game-dev pivot
- [x] Create the four new GitHub repos and local clones
- [x] Launch one Codex lane per new repo to scaffold it fully
- [x] Review generated repo content and fix public-facing path leaks
- [x] Run truthful verification checks on the new repos
- [x] Commit and push all four new repos
- [x] Rewrite `~/github/dunamismax/README.md` for the C#/game-dev pivot and push it
- [ ] Audit/retire local Rust repos (deferred by current user instruction)

## Completed target repos
- [x] `godot-csharp-lab` — scaffolded, link cleanup committed, pushed
- [x] `blender-game-assets` — scaffolded, committed, pushed
- [x] `game-dev-tools-py` — scaffolded, tests passed, committed, pushed
- [x] `courier-of-the-weird` — scaffolded, committed, pushed
- [x] `dunamismax` — profile README rewritten and pushed

## Rust repos intentionally untouched
- [ ] `abi-audit`
- [ ] `cargo-advisor`
- [ ] `cargo-trust`
- [ ] `explain-build`

## Acceptance checks / validation commands
- `PYTHONPATH=src python3 -m unittest discover -s tests -v` in `~/github/game-dev-tools-py`
- `PYTHONPATH=src python3 -m game_dev_tools.cli --help`
- `python3 tools/asset_pipeline/build_art_manifest.py --help` in `~/github/courier-of-the-weird`
- `git -C <repo> diff --check` for `godot-csharp-lab`, `blender-game-assets`, `game-dev-tools-py`, `courier-of-the-weird`, `dunamismax`
- `rg -n '/Users/sawyer' <repo>` path-leak scan across the same repos
- `/Users/sawyer/.openclaw/workspace-codex-orchestrator/scripts/agent-attribution-audit.sh <repo> origin/main` before each push

## Verification snapshot
- `game-dev-tools-py` unit tests: 5 tests passed
- `game-dev-tools-py` CLI help path works
- `courier-of-the-weird` Python asset helper responds to `--help`
- `godot-csharp-lab` required scaffold files exist, but runtime validation is still blocked by missing local `godot` / `dotnet`
- `blender-game-assets` docs/layout verified structurally, but Blender runtime validation is blocked by missing local `blender`
- All five touched repos are now clean on `main` after push

## Immediate next-pass priorities
- Wait for the user’s next direction on the Rust repos
- If requested later, audit and retire the Rust repos without touching the new game-dev repos
- Optionally install/verify Godot + .NET + Blender locally for actual runtime validation

## Blockers / pending decisions
- Local runtime validation for Godot/C# and Blender workflows remains blocked because `godot`, `dotnet`, and `blender` are not currently available on PATH
- Rust repo retirement work is deferred by explicit user instruction
