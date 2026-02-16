# Utilities

Utility and orchestration flows live in TypeScript and run with Bun.

## Setup

```bash
bun install
bun run bootstrap
```

## Script Entrypoints

```bash
bun run setup:minio
bun run setup:zig
bun run infra:up
bun run infra:down
bun run infra:logs
```

## Infrastructure

Infra definitions are in `infra/`:

- PostgreSQL (`pgvector` image)
- MinIO (S3-compatible object storage)
- Caddy (reverse proxy)

Default local ports (from `infra/.env.example`):

- PostgreSQL: `15432`
- MinIO API: `19000`
- MinIO Console: `19001`
- Caddy HTTP: `18080`
- Caddy HTTPS: `18443`
