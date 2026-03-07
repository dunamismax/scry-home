# BUILD.md

## Task
Full local cleanup pass across `/Users/sawyer/github` with an aggressive keep/delete/consolidate stance.

## User Directives
- Keep these repos: `scry-home`, `dunamismax`, `boring-go-web`, `c-from-the-ground-up`, `scryfall-discord-bot`, `hello-world-from-hell`
- Every other repo may be consolidated or deleted locally if that is the best call
- Prefer Python going forward; if any kept repo were TypeScript-heavy, rewrite to Python/Django where sensible
- Make local changes, commit them, push them, then report what remote-side renames/deletions Stephen should do manually
- Use an iron fist; no sentimental preservation

## Ranked Execution Checklist
1. **Stabilize keepers**
   - `scry-home`: resolve canonical naming/path drift, tighten docs to reality
   - `dunamismax`: trim profile metadata to surviving repos and simplify generation surface
   - `boring-go-web`: make repo honest, fix public auth/CRUD contradiction, remove stale schema/docs claims
   - `c-from-the-ground-up`: fix README drift, repair multithreaded word-count bug, add compile-all smoke coverage, remove tracked build artifacts
   - `scryfall-discord-bot`: simplify manager/process story, remove naming residue, trim unused deps, add minimal tests
   - `hello-world-from-hell`: fix build/test hygiene, remove committed binaries, rewrite docs as novelty repo not serious systems artifact
2. **Prune portfolio**
   - Delete or archive all non-keeper repos locally after keeper references are updated
   - Update cross-references in surviving repos so deleted repos are not presented as active projects
3. **Verify**
   - Run repo-specific lint/typecheck/test/build checks where applicable
   - Inspect diffs and final state manually
4. **Commit and push**
   - Atomic commits per surviving repo
   - Push to remotes only after verification
5. **Final handoff**
   - Report exact local changes, pushed commits, and remote-side actions Stephen should take manually

## Active Lanes
- `keeper-scry-home`
- `keeper-dunamismax`
- `keeper-boring-go-web`
- `keeper-c-from-the-ground-up`
- `keeper-scryfall-discord-bot`
- `keeper-hello-world-from-hell`
- later: local prune / verify / commit / push
