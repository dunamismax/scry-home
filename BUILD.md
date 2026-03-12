# Build Tracker

**Status:** rewrite complete

## Completed

- Rebuilt the repo as a Bun + pnpm TypeScript workspace.
- Added TanStack Start web app, shared Effect-based packages, Bun CLI, Drizzle schema, Better Auth integration, TanStack AI server route, OpenTelemetry bootstrap, Biome config, and Vitest wiring.
- Removed the legacy repo surface, mirrored workspace exports, and outdated top-level instructions.

## Verification

```bash
pnpm check
```

Repo-wide verification is currently green.

## Remaining Risk

- `packages/ai` depends on both Mastra and `@tanstack/ai-openai`; keep the dependency graph aligned when updating AI packages.
