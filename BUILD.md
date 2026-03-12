# Build Tracker

**Status:** stack cleanup complete

## Completed

- Consolidated the repo onto a Bun workspace with TypeScript, TanStack Start, Drizzle, Better Auth, Zod, Biome, Vitest, and OpenTelemetry.
- Removed the legacy shared utility layer and replaced validation/contracts with Zod.
- Removed the in-repo AI layer, stale workspace metadata, and outdated top-level instructions.

## Verification

```bash
bun run check
```

Repo-wide verification is currently green.
