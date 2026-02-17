# astro-web-template

Primary full-stack Astro web template app (currently fresh scaffold baseline).

## Current State

- Created via `npm create astro@latest`
- Template: Astro basics starter
- Astro version: `5.17.1`
- Lockfile: `bun.lock` (normalized for Bun-first workflows)
- Current rendering output: static (starter default)
- Current scope: minimal starter surface before full-stack rebuild

## Current Structure

```text
apps/astro-web-template/
├── astro.config.mjs
├── package.json
├── bun.lock
├── public/
│   ├── favicon.ico
│   └── favicon.svg
└── src/
    ├── assets/
    │   ├── astro.svg
    │   └── background.svg
    ├── components/
    │   └── Welcome.astro
    ├── layouts/
    │   └── Layout.astro
    └── pages/
        └── index.astro
```

## Commands

Run from `apps/astro-web-template`:

```bash
bun run dev
bun run build
bun run preview
```

## Next Phase

This app is the designated target for rebuilding a complete full-stack Astro website template for the scry stack.
